import { useCallback, useSyncExternalStore } from 'react';

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

  worker = new Worker(new URL('../workers/kinyarwanda-asr.worker.js', import.meta.url), {
    type: 'module',
  });
  worker.onmessage = ({ data }) => {
    if (data.type === 'progress') {
      updateState({ phase: 'loading', progress: data.progress, error: '' });
      return;
    }
    if (data.type === 'phase') {
      updateState({ phase: data.phase, error: '' });
      return;
    }
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
    const error = new Error(event.message || 'The Kinyarwanda transcription worker failed.');
    for (const pending of pendingRequests.values()) pending.reject(error);
    pendingRequests.clear();
    worker = undefined;
    isPreloading = false;
    isModelReady = false;
    updateState({ phase: 'idle', error: error.message });
  };
  return worker;
}

function prepareModel() {
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

async function transcribeAudio(blob) {
  if (isTranscribing) throw new Error('A transcription is already in progress.');
  isTranscribing = true;
  updateState({ phase: 'decoding', progress: isModelReady ? 100 : state.progress, error: '' });

  try {
    const audio = await decodeAudio(blob);
    const workerInstance = getWorker();
    const id = `request-${++requestId}`;
    updateState({ phase: isModelReady ? 'decoding' : 'loading' });

    const result = new Promise((resolve, reject) => {
      pendingRequests.set(id, { resolve, reject });
    });
    try {
      workerInstance.postMessage({ type: 'transcribe', requestId: id, audio }, [audio.buffer]);
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

export default function useBrowserKinyarwandaAsr() {
  const transcriptionState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const transcribe = useCallback((blob) => transcribeAudio(blob), []);
  const prepare = useCallback(() => prepareModel(), []);

  return { ...transcriptionState, transcribe, prepare };
}
