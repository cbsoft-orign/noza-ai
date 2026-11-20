import { useCallback, useEffect, useSyncExternalStore } from 'react';

const TARGET_SAMPLE_RATE = 16_000;
const listeners = new Set();
const pendingRequests = new Map();
let worker;
let requestId = 0;
let isPreloading = false;
let isModelReady = false;
let isTranscribing = false;
let state = { phase: 'idle', progress: 0, error: '' };

function updateState(nextState) {
  state = { ...state, ...nextState };
  for (const listener of listeners) listener(state);
}

function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

function getWorker() {
  if (worker) return worker;

  worker = new Worker(new URL('../workers/whisper.worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => {
    if (data.type === 'progress') {
      updateState({ phase: 'loading', progress: data.progress, error: '' });
      return;
    }
    if (data.type === 'phase') {
      updateState({ phase: data.phase, error: '' });
      return;
    }
    if (data.type === 'fallback') return;
    if (data.type === 'model-ready') {
      isModelReady = true;
      updateState({ progress: 100 });
      return;
    }
    if (data.type === 'preloaded') {
      isPreloading = false;
      isModelReady = true;
      updateState({ phase: 'idle', progress: 100, error: '' });
      return;
    }
    if (data.type === 'preload-error') {
      isPreloading = false;
      updateState({ phase: 'idle', progress: 0, error: data.message });
      return;
    }

    const pending = pendingRequests.get(data.requestId);
    if (!pending) return;
    pendingRequests.delete(data.requestId);
    if (data.type === 'result') {
      pending.resolve(data.text);
      updateState({ error: '' });
    } else if (data.type === 'error') {
      pending.reject(new Error(data.message));
      updateState({ error: data.message });
    }
  };
  worker.onerror = (event) => {
    const error = new Error(event.message || 'The browser transcription worker failed.');
    for (const pending of pendingRequests.values()) pending.reject(error);
    pendingRequests.clear();
    worker = undefined;
    isPreloading = false;
    isModelReady = false;
    updateState({ phase: 'idle', error: error.message });
  };
  return worker;
}

function preloadModel() {
  if (isModelReady || isPreloading) return;
  isPreloading = true;
  updateState({ phase: 'loading', progress: 0, error: '' });
  try {
    getWorker().postMessage({ type: 'preload', requestId: 'preload' });
  } catch (error) {
    isPreloading = false;
    updateState({ phase: 'idle', error: error instanceof Error ? error.message : String(error) });
  }
}

async function decodeAudio(blob) {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  const OfflineAudioContextConstructor = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!AudioContextConstructor || !OfflineAudioContextConstructor) {
    throw new Error('This browser cannot decode audio for transcription.');
  }

  const audioContext = new AudioContextConstructor();
  try {
    const audioBuffer = await audioContext.decodeAudioData(await blob.arrayBuffer());
    const outputLength = Math.ceil(audioBuffer.duration * TARGET_SAMPLE_RATE);
    if (!outputLength) throw new Error('No audio was recorded. Try again.');

    const offlineContext = new OfflineAudioContextConstructor(1, outputLength, TARGET_SAMPLE_RATE);
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    const resampled = await offlineContext.startRendering();
    return new Float32Array(resampled.getChannelData(0));
  } finally {
    await audioContext.close();
  }
}

async function transcribeAudio(blob, language, productNames) {
  if (isTranscribing) throw new Error('A transcription is already in progress.');
  isTranscribing = true;
  updateState({ phase: 'decoding', progress: isModelReady ? 100 : 0, error: '' });

  try {
    const audio = await decodeAudio(blob);
    const workerInstance = getWorker();
    const id = `request-${++requestId}`;
    updateState({ phase: isModelReady ? 'transcribing' : 'loading' });

    const result = new Promise((resolve, reject) => {
      pendingRequests.set(id, { resolve, reject });
    });
    try {
      workerInstance.postMessage(
        { type: 'transcribe', requestId: id, audio, language, productNames },
        [audio.buffer],
      );
    } catch (error) {
      pendingRequests.delete(id);
      throw error;
    }
    const transcript = await result;
    updateState({ phase: 'idle', error: '' });
    return transcript;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    updateState({ phase: 'idle', error: message });
    throw error;
  } finally {
    isTranscribing = false;
  }
}

function startOnlineRecognition(onFinalTranscript, productNames = []) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    preloadModel();
    return null;
  }

  let recognition;
  try {
    recognition = new Recognition();
  } catch {
    preloadModel();
    return null;
  }
  recognition.lang = 'rw-RW';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;
  const SpeechRecognitionPhrase = window.SpeechRecognitionPhrase;
  if (SpeechRecognitionPhrase && 'phrases' in recognition) {
    const phrases = [
      'Gurisha umuceri ibiro bibiri',
      'Ongeraho stock isukari eshanu',
      'Reba stock',
      'Raporo y’uyu munsi',
      ...productNames.flatMap((name) => [`Gurisha ${name}`, `Ongeraho stock ${name}`]),
    ];
    recognition.phrases = phrases.map((phrase) => new SpeechRecognitionPhrase(phrase, 8));
  }

  let finalTranscript = '';
  let settled = false;
  let resolveResult;
  const result = new Promise((resolve) => {
    resolveResult = resolve;
  });
  const finish = (text) => {
    if (settled) return;
    settled = true;
    updateState({ phase: 'idle', error: '' });
    resolveResult(text.trim());
  };

  recognition.onresult = (event) => {
    finalTranscript = Array.from(event.results)
      .filter((entry) => entry.isFinal)
      .map((entry) => entry[0]?.transcript ?? '')
      .join(' ')
      .trim();
    if (!finalTranscript) return;
    onFinalTranscript?.();
    recognition.stop();
  };
  recognition.onerror = () => {
    finish('');
    preloadModel();
  };
  recognition.onend = () => {
    finish(finalTranscript);
    if (!finalTranscript) preloadModel();
  };

  updateState({ phase: 'online', error: '' });
  try {
    recognition.start();
  } catch {
    finish('');
    preloadModel();
  }

  return {
    result,
    stop: () => {
      if (!settled) recognition.stop();
    },
  };
}

export default function useBrowserWhisper() {
  const transcriptionState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) preloadModel();
  }, []);

  const transcribe = useCallback(
    (blob, language = 'rw', productNames = []) => transcribeAudio(blob, language, productNames),
    [],
  );

  const recognizeOnline = startOnlineRecognition;

  return { ...transcriptionState, transcribe, recognizeOnline };
}
