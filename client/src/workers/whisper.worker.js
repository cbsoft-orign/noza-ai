import { env, pipeline } from '@huggingface/transformers';

const MODEL_ID = 'onnx-community/whisper-tiny';

env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;
env.backends.onnx.wasm.numThreads = 1;

let transcriber;
let transcriberPromise;
let activeDevice = 'wasm';

async function supportsWebGPU() {
  try {
    return Boolean(await self.navigator.gpu?.requestAdapter());
  } catch {
    return false;
  }
}

function createProgressCallback(requestId) {
  const files = new Map();
  return (info) => {
    if (!info.file) return;
    const key = `${info.name ?? ''}/${info.file}`;
    const previous = files.get(key) ?? { loaded: 0, total: 0 };
    const loaded = info.status === 'done'
      ? (previous.total || previous.loaded)
      : Number(info.loaded ?? previous.loaded);
    const total = Number(info.total ?? previous.total);
    files.set(key, { loaded, total });

    const filesWithSizes = [...files.values()].filter((file) => file.total > 0);
    const progress = filesWithSizes.length
      ? Math.round(
        filesWithSizes.reduce((sum, file) => sum + Math.min(file.loaded, file.total), 0)
        / filesWithSizes.reduce((sum, file) => sum + file.total, 0)
        * 100,
      )
      : 0;
    self.postMessage({ type: 'progress', requestId, progress });
  };
}

async function loadTranscriber(requestId, device) {
  return pipeline('automatic-speech-recognition', MODEL_ID, {
    device,
    dtype: device === 'webgpu' ? 'q4' : 'q8',
    progress_callback: createProgressCallback(requestId),
  });
}

async function getTranscriber(requestId, allowWebGPU = true) {
  if (transcriber) return transcriber;
  if (transcriberPromise) return transcriberPromise;

  const loading = (async () => {
    if (allowWebGPU && await supportsWebGPU()) {
      try {
        activeDevice = 'webgpu';
        transcriber = await loadTranscriber(requestId, activeDevice);
        return transcriber;
      } catch (error) {
        self.postMessage({
          type: 'fallback',
          requestId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    activeDevice = 'wasm';
    transcriber = await loadTranscriber(requestId, activeDevice);
    return transcriber;
  })();
  transcriberPromise = loading;
  try {
    return await loading;
  } finally {
    if (transcriberPromise === loading) transcriberPromise = undefined;
  }
}

function createCommandPromptIds(model, productNames) {
  const tokenizerModel = model.tokenizer?.model;
  if (typeof tokenizerModel?.convert_tokens_to_ids !== 'function'
    || typeof model.tokenizer?.encode !== 'function') return undefined;

  const startOfPreviousIds = tokenizerModel.convert_tokens_to_ids(['<|startofprev|>']);
  const startOfPreviousId = startOfPreviousIds[0];
  if (!Number.isInteger(startOfPreviousId)) return undefined;

  const products = [...new Set(
    (productNames ?? [])
      .filter((name) => typeof name === 'string')
      .map((name) => name.trim().slice(0, 40))
      .filter(Boolean),
  )].slice(0, 20);
  const commandVocabulary = 'Gurisha, kugurisha, Ongeraho stock, nakiriye, umuceri, ibirayi, isukari, amavuta, ibishyimbo, umunyu, ibiro, kilo, kimwe, rimwe, bibiri, ebyiri, bitatu, eshatu, kane, bine, gatanu, bitanu, umunani, icumi.';

  while (true) {
    const prompt = products.length
      ? `${commandVocabulary} Shop products: ${products.join(', ')}.`
      : commandVocabulary;
    const textIds = model.tokenizer.encode(prompt, { add_special_tokens: false });
    const promptIds = [startOfPreviousId, ...textIds];
    if (promptIds.length <= 200 || products.length === 0) return promptIds.slice(0, 200);
    products.pop();
  }
}

async function transcribe(requestId, audio, language, productNames) {
  const model = await getTranscriber(requestId);
  self.postMessage({ type: 'progress', requestId, progress: 100 });
  self.postMessage({ type: 'model-ready', requestId });
  self.postMessage({ type: 'phase', requestId, phase: 'transcribing' });
  const options = { task: 'transcribe', max_new_tokens: 48, num_beams: 1 };

  // The multilingual base model has no Kinyarwanda token, so let it detect the closest language.
  if (language && language !== 'rw' && language !== 'auto') options.language = language;
  const promptIds = createCommandPromptIds(model, productNames);
  if (promptIds) options.prompt_ids = promptIds;

  try {
    const result = await model(audio, options);
    return result.text;
  } catch (error) {
    if (activeDevice !== 'webgpu') throw error;

    self.postMessage({ type: 'fallback', requestId });
    transcriber = undefined;
    activeDevice = 'wasm';
    const cpuModel = await getTranscriber(requestId, false);
    self.postMessage({ type: 'progress', requestId, progress: 100 });
    self.postMessage({ type: 'model-ready', requestId });
    self.postMessage({ type: 'phase', requestId, phase: 'transcribing' });
    const result = await cpuModel(audio, options);
    return result.text;
  }
}

self.addEventListener('message', async ({ data }) => {
  if (data.type === 'preload') {
    try {
      self.postMessage({ type: 'phase', requestId: data.requestId, phase: 'loading' });
      await getTranscriber(data.requestId);
      self.postMessage({ type: 'progress', requestId: data.requestId, progress: 100 });
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
    self.postMessage({ type: 'phase', requestId: data.requestId, phase: 'loading' });
    const text = (await transcribe(data.requestId, data.audio, data.language, data.productNames))
      .replace(/<\|[^|]*\|>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) throw new Error('No speech was recognized. Please try again.');
    self.postMessage({ type: 'result', requestId: data.requestId, text });
  } catch (error) {
    self.postMessage({
      type: 'error',
      requestId: data.requestId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
