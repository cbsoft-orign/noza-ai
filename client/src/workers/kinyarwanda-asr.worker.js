import { AutoFeatureExtractor, env } from '@huggingface/transformers';
import * as ort from 'onnxruntime-web/wasm';

const MODEL_REPOSITORY = 'OpenVoiceOS/w2v-bert-2.0-kinyarwanda-onnx';
const MODEL_REVISION = 'b024f5c30aac9f6f01baaec507a81d12788f0349';
const MODEL_URL = `https://huggingface.co/${MODEL_REPOSITORY}/resolve/${MODEL_REVISION}/model.int8.onnx`;
const MODEL_SIZE_BYTES = 584_171_949;
const MODEL_CACHE = 'noza-kinyarwanda-asr-v1';
const FEATURE_REPOSITORY = 'badrex/w2v-bert-2.0-kinyarwanda-asr';
const FEATURE_REVISION = 'fca35cff2c827d02f2e87c29a15abd358cd69f25';
const VOCABULARY = [
  '▁', "'", 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '[UNK]', '<blk>', '<s>', '</s>',
];
const BLANK_TOKEN_ID = 29;

env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;
ort.env.wasm.numThreads = self.crossOriginIsolated
  ? Math.max(1, Math.min(4, self.navigator.hardwareConcurrency || 1))
  : 1;
ort.env.logLevel = 'error';

let featureExtractor;
let session;
let resourcesPromise;

function postProgress(requestId, progress) {
  self.postMessage({ type: 'progress', requestId, progress });
}

async function loadModelBytes(requestId) {
  if (!self.caches) throw new Error('This browser does not support model caching.');

  const cache = await self.caches.open(MODEL_CACHE);
  const cached = await cache.match(MODEL_URL);
  if (cached) {
    postProgress(requestId, 100);
    return cached.arrayBuffer();
  }

  const response = await fetch(MODEL_URL);
  if (!response.ok) throw new Error(`Could not download the Kinyarwanda model (${response.status}).`);

  const totalBytes = Number(response.headers.get('content-length')) || MODEL_SIZE_BYTES;
  if (!response.body) {
    await cache.put(MODEL_URL, response.clone());
    const modelBytes = await response.arrayBuffer();
    postProgress(requestId, 100);
    return modelBytes;
  }

  const [progressStream, cacheStream] = response.body.tee();
  let cacheError;
  const cacheWrite = cache.put(
    MODEL_URL,
    new Response(cacheStream, { headers: { 'Content-Type': 'application/octet-stream' } }),
  ).catch((error) => {
    cacheError = error;
  });

  const reader = progressStream.getReader();
  let loadedBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      loadedBytes += value.byteLength;
      postProgress(requestId, Math.min(99, Math.round((loadedBytes / totalBytes) * 100)));
    }
  } catch (error) {
    await cacheWrite;
    throw error;
  } finally {
    reader.releaseLock();
  }
  await cacheWrite;
  if (cacheError) throw cacheError;

  const downloaded = await cache.match(MODEL_URL);
  if (!downloaded) throw new Error('The downloaded Kinyarwanda model could not be cached.');
  postProgress(requestId, 100);
  return downloaded.arrayBuffer();
}

async function getResources(requestId) {
  if (session && featureExtractor) return { session, featureExtractor };
  if (resourcesPromise) return resourcesPromise;

  const loading = (async () => {
    self.postMessage({ type: 'phase', requestId, phase: 'loading' });
    const [loadedFeatureExtractor, modelBytes] = await Promise.all([
      AutoFeatureExtractor.from_pretrained(FEATURE_REPOSITORY, { revision: FEATURE_REVISION }),
      loadModelBytes(requestId),
    ]);
    const loadedSession = await ort.InferenceSession.create(modelBytes, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    featureExtractor = loadedFeatureExtractor;
    session = loadedSession;
    return { session, featureExtractor };
  })();
  resourcesPromise = loading;
  try {
    return await loading;
  } finally {
    if (resourcesPromise === loading) resourcesPromise = undefined;
  }
}

function countValidFrames(attentionMask, fallbackLength) {
  if (!attentionMask?.data) return fallbackLength;
  let validFrames = 0;
  for (const value of attentionMask.data) {
    if (value !== 0 && value !== 0n) validFrames += 1;
  }
  return validFrames;
}

function decodeCtc(logprobs, frameCount, vocabularySize) {
  const output = [];
  let previousTokenId = -1;

  for (let frame = 0; frame < frameCount; frame += 1) {
    const frameOffset = frame * vocabularySize;
    let bestTokenId = 0;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (let tokenId = 0; tokenId < vocabularySize; tokenId += 1) {
      const score = logprobs[frameOffset + tokenId];
      if (score > bestScore) {
        bestScore = score;
        bestTokenId = tokenId;
      }
    }

    if (bestTokenId !== previousTokenId && bestTokenId !== BLANK_TOKEN_ID) {
      const token = VOCABULARY[bestTokenId];
      if (token === '▁') {
        if (output.length && output[output.length - 1] !== ' ') output.push(' ');
      } else if (token && bestTokenId < BLANK_TOKEN_ID) {
        output.push(token);
      }
    }
    previousTokenId = bestTokenId;
  }

  return output.join('').replace(/\s+/g, ' ').trim();
}

async function transcribe(requestId, audio) {
  const resources = await getResources(requestId);
  self.postMessage({ type: 'model-ready', requestId });
  self.postMessage({ type: 'phase', requestId, phase: 'decoding' });

  const prepared = await resources.featureExtractor(audio, {
    padding: true,
    pad_to_multiple_of: 2,
    do_normalize_per_mel_bins: true,
    return_attention_mask: true,
  });
  const features = prepared.input_features;
  const validFrames = countValidFrames(prepared.attention_mask, features.dims[1]);
  if (!validFrames) throw new Error('No speech was recognized. Please try again.');

  self.postMessage({ type: 'phase', requestId, phase: 'transcribing' });
  const result = await resources.session.run({
    features: new ort.Tensor('float32', features.data, features.dims),
    features_lens: new ort.Tensor(
      'int64',
      new BigInt64Array([BigInt(validFrames)]),
      [1],
    ),
  });
  const logits = result.logprobs ?? Object.values(result).find((tensor) => tensor.dims.length === 3);
  if (!logits || logits.dims.length !== 3) {
    throw new Error('The Kinyarwanda model returned an unsupported output shape.');
  }
  const frameCount = logits.dims[1];
  const vocabularySize = logits.dims[2];
  const text = decodeCtc(logits.data, frameCount, vocabularySize);
  if (!text) throw new Error('No speech was recognized. Please try again.');
  return text;
}

self.addEventListener('message', async ({ data }) => {
  if (data.type === 'preload') {
    try {
      await getResources(data.requestId);
      postProgress(data.requestId, 100);
      self.postMessage({ type: 'model-ready', requestId: data.requestId });
      self.postMessage({ type: 'preloaded', requestId: data.requestId });
    } catch (error) {
      self.postMessage({
        type: 'preload-error',
        requestId: data.requestId,
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }
  if (data.type !== 'transcribe') return;

  try {
    const text = (await transcribe(data.requestId, data.audio))
      .replace(/\s+/g, ' ')
      .trim();
    self.postMessage({ type: 'result', requestId: data.requestId, text });
  } catch (error) {
    self.postMessage({
      type: 'error',
      requestId: data.requestId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
