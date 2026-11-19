import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const GRAPH_API_HOST = 'graph.facebook.com';
const WHATSAPP_MEDIA_HOSTS = ['fbsbx.com', 'fbcdn.net'];
let transcriptionQueue: Promise<void> = Promise.resolve();

type WorkerResponse = {
  requestId: string;
  text?: string;
  error?: string;
};

type PendingTranscription = {
  resolve: (text: string) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
};

type TranscriptionWorker = {
  child: ChildProcessWithoutNullStreams;
  scriptVersion: string;
  pending: Map<string, PendingTranscription>;
  outputBuffer: string;
  nextRequestId: number;
  stopped: boolean;
};

type TranscriptionWorkerGlobals = typeof globalThis & {
  nozaTranscriptionWorker?: TranscriptionWorker;
  nozaTranscriptionWorkerShutdownRegistered?: boolean;
};

const workerGlobals = globalThis as TranscriptionWorkerGlobals;

function isWhatsAppMediaHost(hostname: string) {
  return WHATSAPP_MEDIA_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

async function downloadAudio(url: string) {
  const mediaUrl = new URL(url);
  if (mediaUrl.protocol !== 'https:') {
    throw new Error('Audio URL must use HTTPS');
  }

  const token = process.env.WHATSAPP_TOKEN;
  const isGraphMedia = mediaUrl.hostname === GRAPH_API_HOST;
  if (!isGraphMedia && !isWhatsAppMediaHost(mediaUrl.hostname)) {
    throw new Error('Audio URL must be a WhatsApp media URL');
  }
  if (isGraphMedia && !token) {
    throw new Error('WHATSAPP_TOKEN is required to download WhatsApp media');
  }

  if (isGraphMedia) {
    const metadataResponse = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30_000),
    });
    if (!metadataResponse.ok) {
      throw new Error(`WhatsApp media metadata request failed (${metadataResponse.status})`);
    }

    const metadata = await metadataResponse.json() as { url?: string };
    if (!metadata.url) {
      throw new Error('WhatsApp media metadata did not include a download URL');
    }
    const downloadUrl = new URL(metadata.url);
    if (downloadUrl.protocol !== 'https:' || !isWhatsAppMediaHost(downloadUrl.hostname)) {
      throw new Error('WhatsApp returned an unsupported media download URL');
    }
    mediaUrl.href = downloadUrl.href;
  }

  const headers: Record<string, string> = {};
  if (token && isWhatsAppMediaHost(mediaUrl.hostname)) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(mediaUrl, {
    headers,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`WhatsApp media download failed (${response.status})`);
  }

  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > MAX_AUDIO_BYTES) {
    throw new Error('Audio file exceeds the 25 MB limit');
  }
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('WhatsApp media response did not contain a readable body');
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    totalBytes += value.byteLength;
    if (totalBytes > MAX_AUDIO_BYTES) {
      await reader.cancel();
      throw new Error('Audio file exceeds the 25 MB limit');
    }
    chunks.push(Buffer.from(value));
  }
  if (totalBytes === 0) {
    throw new Error('Audio file is empty or exceeds the 25 MB limit');
  }
  return Buffer.concat(chunks, totalBytes);
}

function workerProcessError(error: Error) {
  const processError = error as NodeJS.ErrnoException;
  if (processError.code === 'ENOENT' || String(processError.code) === '9009' || /Python was not found/i.test(error.message)) {
    return new Error('Python 3.10+ is required for Whisper. Create the server .venv and install requirements; see the Windows setup instructions in server/README.md.');
  }
  return error;
}

function stopTranscriptionWorker(worker: TranscriptionWorker, error: Error) {
  if (worker.stopped) {
    return;
  }
  worker.stopped = true;
  for (const pending of worker.pending.values()) {
    clearTimeout(pending.timeout);
    pending.reject(error);
  }
  worker.pending.clear();
  if (workerGlobals.nozaTranscriptionWorker === worker) {
    delete workerGlobals.nozaTranscriptionWorker;
  }
}

function handleWorkerOutput(worker: TranscriptionWorker, chunk: string) {
  worker.outputBuffer += chunk;
  let newlineIndex = worker.outputBuffer.indexOf('\n');
  while (newlineIndex !== -1) {
    const line = worker.outputBuffer.slice(0, newlineIndex).trim();
    worker.outputBuffer = worker.outputBuffer.slice(newlineIndex + 1);
    newlineIndex = worker.outputBuffer.indexOf('\n');
    if (!line) {
      continue;
    }

    let response: WorkerResponse;
    try {
      response = JSON.parse(line) as WorkerResponse;
    } catch {
      stopTranscriptionWorker(worker, new Error('Transcription worker returned invalid output'));
      worker.child.kill();
      return;
    }

    const pending = worker.pending.get(response.requestId);
    if (!pending) {
      continue;
    }
    worker.pending.delete(response.requestId);
    clearTimeout(pending.timeout);
    if (response.error) {
      pending.reject(new Error(response.error));
    } else if (response.text?.trim()) {
      pending.resolve(response.text.trim());
    } else {
      pending.reject(new Error('Transcription worker returned an empty transcript'));
    }
  }
}

async function getTranscriptionWorker() {
  const script = path.join(process.cwd(), 'scripts', 'transcribe.py');
  const scriptStats = await fs.stat(script);
  const scriptVersion = `${scriptStats.mtimeMs}:${scriptStats.size}`;
  const existing = workerGlobals.nozaTranscriptionWorker;
  if (
    existing &&
    !existing.stopped &&
    existing.child.exitCode === null &&
    existing.scriptVersion === scriptVersion
  ) {
    return existing;
  }
  if (existing && !existing.stopped && existing.child.exitCode === null) {
    stopTranscriptionWorker(existing, new Error('Transcription worker script changed; restarting worker'));
    existing.child.kill();
  }

  let python = process.env.PYTHON_BIN;
  let pythonArgs: string[] = [];
  if (!python && process.platform === 'win32') {
    const virtualEnvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    try {
      await fs.access(virtualEnvPython);
      python = virtualEnvPython;
    } catch {
      python = 'py';
      pythonArgs = ['-3'];
    }
  } else if (!python) {
    python = 'python3';
  }

  const child = spawn(python, [...pythonArgs, script, '--worker'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const worker: TranscriptionWorker = {
    child,
    scriptVersion,
    pending: new Map(),
    outputBuffer: '',
    nextRequestId: 0,
    stopped: false,
  };
  workerGlobals.nozaTranscriptionWorker = worker;

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk: string) => handleWorkerOutput(worker, chunk));
  child.stderr.on('data', (chunk: Buffer | string) => {
    const detail = chunk.toString().trim();
    if (detail) {
      console.error('Transcription worker:', detail);
    }
  });
  child.on('error', (error) => stopTranscriptionWorker(worker, workerProcessError(error)));
  child.on('exit', (code, signal) => {
    stopTranscriptionWorker(
      worker,
      new Error(`Transcription worker exited unexpectedly (${code ?? signal ?? 'unknown'})`),
    );
  });
  child.stdin.on('error', (error) => stopTranscriptionWorker(worker, workerProcessError(error)));

  if (!workerGlobals.nozaTranscriptionWorkerShutdownRegistered) {
    workerGlobals.nozaTranscriptionWorkerShutdownRegistered = true;
    const shutdown = () => workerGlobals.nozaTranscriptionWorker?.child.kill();
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
    process.once('exit', shutdown);
  }

  return worker;
}

async function transcribeWithWorker(audioFile: string, preferredLanguage: 'auto' | 'rw', vocabulary: string[]) {
  const worker = await getTranscriptionWorker();
  const requestId = String(++worker.nextRequestId);
  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      stopTranscriptionWorker(worker, new Error('Local transcription timed out'));
      worker.child.kill();
    }, 180_000);
    worker.pending.set(requestId, { resolve, reject, timeout });
    worker.child.stdin.write(`${JSON.stringify({ requestId, audioPath: audioFile, preferredLanguage, vocabulary })}\n`, (error) => {
      if (error) {
        const pending = worker.pending.get(requestId);
        if (pending) {
          worker.pending.delete(requestId);
          clearTimeout(pending.timeout);
          pending.reject(workerProcessError(error));
        }
      }
    });
  });
}

async function runLocalTranscription(
  buffer: Buffer,
  extension = 'ogg',
  preferredLanguage: 'auto' | 'rw' = 'auto',
  vocabulary: string[] = [],
) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noza-whisper-'));
  const safeExtension = /^[a-z0-9]{2,5}$/i.test(extension) ? extension : 'ogg';
  const audioFile = path.join(tempDir, `voice.${safeExtension}`);
  try {
    await fs.writeFile(audioFile, buffer);
    return await transcribeWithWorker(audioFile, preferredLanguage, vocabulary);
  } catch (error) {
    if (error instanceof Error && /ffmpeg/i.test(error.message)) {
      throw new Error('FFmpeg is required for Whisper and must be available on PATH.');
    }
    throw error;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

export async function transcribeAudioFromUrl(url: string) {
  const buffer = await downloadAudio(url);
  return transcribeAudioBuffer(buffer);
}

export async function transcribeAudioBuffer(
  buffer: Buffer,
  extension = 'webm',
  preferredLanguage: 'auto' | 'rw' = 'auto',
  vocabulary: string[] = [],
) {
  if (!buffer.length || buffer.length > MAX_AUDIO_BYTES) {
    throw new Error('Audio file must be between 1 byte and 25 MB');
  }
  const transcription = transcriptionQueue.then(() => runLocalTranscription(buffer, extension, preferredLanguage, vocabulary));
  transcriptionQueue = transcription.then(() => undefined, () => undefined);
  return transcription;
}

export async function generateVoiceNote(text: string) {
  if (!process.env.GOOGLE_CLOUD_PROJECT) {
    return null;
  }

  try {
    const client = new TextToSpeechClient();
    const request: any = {
      input: { text },
      voice: { languageCode: 'rw-RW', ssmlGender: 'FEMALE' },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const result = await client.synthesizeSpeech(request);
    return result?.[0]?.audioContent ?? null;
  } catch {
    return null;
  }
}
