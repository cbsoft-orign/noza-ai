import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

const execFileAsync = promisify(execFile);
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const GRAPH_API_HOST = 'graph.facebook.com';
const WHATSAPP_MEDIA_HOSTS = ['fbsbx.com', 'fbcdn.net'];
let transcriptionQueue: Promise<void> = Promise.resolve();

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

async function runLocalTranscription(buffer: Buffer, extension = 'ogg') {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noza-whisper-'));
  const safeExtension = /^[a-z0-9]{2,5}$/i.test(extension) ? extension : 'ogg';
  const audioFile = path.join(tempDir, `voice.${safeExtension}`);
  try {
    await fs.writeFile(audioFile, buffer);
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
    const script = path.join(process.cwd(), 'scripts', 'transcribe.py');
    let stdout: string;
    try {
      ({ stdout } = await execFileAsync(python, [...pythonArgs, script, audioFile], {
        timeout: 180_000,
        maxBuffer: 1024 * 1024,
        env: process.env,
      }));
    } catch (error) {
      const processError = error as NodeJS.ErrnoException & { stderr?: string };
      const detail = `${processError.message}\n${processError.stderr ?? ''}`;
      if (processError.code === 'ENOENT' || String(processError.code) === '9009' || /Python was not found/i.test(detail)) {
        throw new Error('Python 3.10+ is required for Whisper. Create the server .venv and install requirements; see the Windows setup instructions in server/README.md.');
      }
      if (/ffmpeg/i.test(detail)) {
        throw new Error('FFmpeg is required for Whisper and must be available on PATH.');
      }
      throw error;
    }
    const result = JSON.parse(stdout) as { text?: string };
    if (!result.text?.trim()) {
      throw new Error('Local Whisper returned an empty transcript');
    }
    return result.text.trim();
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

export async function transcribeAudioFromUrl(url: string) {
  const buffer = await downloadAudio(url);
  return transcribeAudioBuffer(buffer);
}

export async function transcribeAudioBuffer(buffer: Buffer, extension = 'webm') {
  if (!buffer.length || buffer.length > MAX_AUDIO_BYTES) {
    throw new Error('Audio file must be between 1 byte and 25 MB');
  }
  const transcription = transcriptionQueue.then(() => runLocalTranscription(buffer, extension));
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
