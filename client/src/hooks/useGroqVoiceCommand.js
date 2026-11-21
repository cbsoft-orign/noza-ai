import { useCallback, useRef, useState, useEffect } from 'react';
import { apiUrl } from '../api';

const COLD_START_NOTICE_MS = 3500;
const REQUEST_TIMEOUT_MS = 75000;

function getAudioFilename(blob) {
  const mimeType = (blob?.type || '').toLowerCase();
  if (mimeType.includes('wav')) return 'voice-command.wav';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'voice-command.mp3';
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'voice-command.m4a';
  if (mimeType.includes('ogg')) return 'voice-command.ogg';
  return 'voice-command.webm';
}

function getBestMimeType() {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/wav',
    'audio/mp4',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

export default function useGroqVoiceCommand() {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [lastCommand, setLastCommand] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const abortControllerRef = useRef(null);

  const stopActiveStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const transcribe = useCallback(async (audioBlob, products = []) => {
    if (!audioBlob || !audioBlob.size) {
      throw new Error('No audio was recorded. Please try speaking again.');
    }

    setProcessing(true);
    setStatusText('Processing Kinyarwanda command...');
    setError('');

    // If Render cold-start is happening, update status after 3.5s
    const coldStartTimer = window.setTimeout(() => {
      setStatusText('Processing Kinyarwanda command... (Server is waking up, please wait a moment)');
    }, COLD_START_NOTICE_MS);

    // Prepare FormData with audio and inventory array
    const formData = new FormData();
    formData.append('audio', audioBlob, getAudioFilename(audioBlob));

    const inventoryNames = Array.isArray(products)
      ? products.map((item) => (typeof item === 'string' ? item : item?.name)).filter(Boolean)
      : [];
    formData.append('inventory', JSON.stringify([...new Set(inventoryNames)]));

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // Direct Render /api/transcribe endpoint
      const transcribeUrl = apiUrl('/api/transcribe');

      const response = await fetch(transcribeUrl, {
        method: 'POST',
        credentials: 'include',
        body: formData,
        signal: controller.signal,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || (data && data.ok === false)) {
        const errorMsg = data?.message || `Voice processing failed (${response.status}). Please try again.`;
        throw new Error(errorMsg);
      }

      if (!data || typeof data.corrected_text !== 'string' || typeof data.action !== 'string') {
        throw new Error('The voice service returned an incomplete response. Please try again.');
      }

      setLastCommand(data);
      return data;
    } catch (requestError) {
      let message = 'Could not reach the voice service. Check your connection and try again.';
      if (requestError.name === 'AbortError') {
        message = 'Voice processing timed out. Render server may be waking up from cold sleep; please try again in a few seconds.';
      } else if (requestError instanceof Error && requestError.message) {
        message = requestError.message;
      }
      setError(message);
      throw new Error(message);
    } finally {
      window.clearTimeout(coldStartTimer);
      window.clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setProcessing(false);
      setStatusText('');
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError('');
    setLastCommand(null);

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      const err = 'Microphone recording is not supported in this browser.';
      setError(err);
      throw new Error(err);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const mimeType = getBestMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError('Microphone recording encountered an error.');
        setRecording(false);
        stopActiveStream();
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      stopActiveStream();
      const msg = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'Microphone access was denied. Please allow microphone permissions.'
        : err.message || 'Could not access the microphone.';
      setError(msg);
      throw new Error(msg);
    }
  }, [stopActiveStream]);

  const stopRecording = useCallback(async (products = []) => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        setRecording(false);
        stopActiveStream();
        reject(new Error('Recorder is not active.'));
        return;
      }

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        stopActiveStream();
        mediaRecorderRef.current = null;
        setRecording(false);

        if (!audioBlob.size) {
          const err = new Error('No audio captured. Please try speaking again.');
          setError(err.message);
          reject(err);
          return;
        }

        try {
          const result = await transcribe(audioBlob, products);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };

      try {
        recorder.stop();
      } catch (err) {
        stopActiveStream();
        setRecording(false);
        reject(err);
      }
    });
  }, [stopActiveStream, transcribe]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    stopActiveStream();
    audioChunksRef.current = [];
    mediaRecorderRef.current = null;
    setRecording(false);
    setProcessing(false);
    setStatusText('');
  }, [stopActiveStream]);

  useEffect(() => {
    return () => {
      cancelRecording();
    };
  }, [cancelRecording]);

  return {
    recording,
    processing,
    statusText,
    error,
    setError,
    lastCommand,
    startRecording,
    stopRecording,
    cancelRecording,
    transcribe,
  };
}
