import json
import os
import re
import sys
import traceback
import warnings

import torch
import whisper


SUPPORTED_CONFIDENCE_THRESHOLD = 0.85
_whisper_model = None
_kinyarwanda_recognizer = None
KINYARWANDA_SHOP_PROMPT = (
    "Umuceri, ibiro, kilo, bibiri, ibiri, abiri, ebyiri, gurisha, "
    "ongeraho, nakiriye, igicuruzwa gishya, isukari, ibirayi, amavuta, "
    "ibishyimbo, umunyu, ububiko, igiciro, kugura, kugurisha, igura, "
    "igurisha, hindura, stock, igipimo."
)


def initialize():
    torch.set_num_threads(min(4, os.cpu_count() or 1))


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = whisper.load_model(
            os.environ.get("WHISPER_MODEL_NAME", "base"),
            device="cpu",
            download_root=os.environ.get(
                "WHISPER_CACHE_DIR",
                os.path.join(os.path.expanduser("~"), ".cache", "whisper"),
            ),
        )
    return _whisper_model


def get_kinyarwanda_recognizer():
    global _kinyarwanda_recognizer
    if _kinyarwanda_recognizer is None:
        kinyarwanda_model_path = os.environ.get(
            "KINYARWANDA_MODEL_PATH",
            os.path.join(os.path.expanduser("~"), ".cache", "noza-ai", "kinyarwanda-model"),
        )
        required_model_files = ("model.safetensors", "preprocessor_config.json")
        if any(
            not os.path.isfile(os.path.join(kinyarwanda_model_path, filename))
            for filename in required_model_files
        ):
            raise RuntimeError(
                f"Kinyarwanda model files are missing from {kinyarwanda_model_path}. "
                f"From the server directory, run \"{sys.executable}\" "
                "scripts/download_models.py and retry transcription."
            )

        from transformers import AutoTokenizer, pipeline

        tokenizer = AutoTokenizer.from_pretrained(
            kinyarwanda_model_path,
            local_files_only=True,
            use_fast=True,
        )
        _kinyarwanda_recognizer = pipeline(
            "automatic-speech-recognition",
            model=kinyarwanda_model_path,
            tokenizer=tokenizer,
            device=-1,
            # This fine-tune uses Whisper's Swahili token for Kinyarwanda.
            generate_kwargs={
                "language": "sw",
                "task": "transcribe",
            },
        )
    return _kinyarwanda_recognizer


def transcribe_kinyarwanda_audio(audio, vocabulary=None):
    recognizer = get_kinyarwanda_recognizer()
    product_names = []
    seen_names = set()
    for name in vocabulary or []:
        if not isinstance(name, str):
            continue
        name = name.strip()[:40]
        normalized_name = name.casefold()
        if name and normalized_name not in seen_names:
            product_names.append(name)
            seen_names.add(normalized_name)
        if len(product_names) == 20:
            break
    prompt = KINYARWANDA_SHOP_PROMPT
    if product_names:
        prompt = f"{prompt} Shop product names: {', '.join(product_names)}."
    prompt_ids = recognizer.tokenizer.get_prompt_ids(prompt, return_tensors="pt")
    while prompt_ids.numel() > 200 and product_names:
        product_names.pop()
        prompt = KINYARWANDA_SHOP_PROMPT
        if product_names:
            prompt = f"{prompt} Shop product names: {', '.join(product_names)}."
        prompt_ids = recognizer.tokenizer.get_prompt_ids(prompt, return_tensors="pt")
    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            message=r"The input name `inputs` is deprecated\. Please make sure to use `input_features` instead\.",
            category=FutureWarning,
            module=r"transformers\.models\.whisper\.generation_whisper",
        )
        result = recognizer(
            {"raw": audio, "sampling_rate": 16000},
            generate_kwargs={"prompt_ids": prompt_ids},
        )
    text = re.sub(r"<\|[^|]*\|>", " ", result["text"])
    return re.sub(r"\s+", " ", text).strip()


def transcribe(audio_path, preferred_language="auto", vocabulary=None):
    if preferred_language not in {"auto", "rw"}:
        raise ValueError(f"Unsupported transcription language: {preferred_language}")
    if preferred_language == "rw":
        audio = whisper.load_audio(audio_path)
        return {
            "text": transcribe_kinyarwanda_audio(audio, vocabulary),
            "detectedLanguage": "rw",
        }

    model = get_whisper_model()
    audio = whisper.load_audio(audio_path)
    mel = whisper.log_mel_spectrogram(whisper.pad_or_trim(audio)).to(model.device)
    _, probabilities = model.detect_language(mel)
    language, confidence = max(probabilities.items(), key=lambda item: item[1])

    if language in {"en", "fr"} and confidence >= SUPPORTED_CONFIDENCE_THRESHOLD:
        result = model.transcribe(audio_path, language=language, fp16=False)
        text = result["text"].strip()
    else:
        text = transcribe_kinyarwanda_audio(audio, vocabulary)

    return {"text": text, "detectedLanguage": language}


def main(audio_path):
    initialize()
    print(json.dumps(transcribe(audio_path)))


def run_worker():
    initialize()
    for line in sys.stdin:
        request_id = None
        try:
            request = json.loads(line)
            request_id = request["requestId"]
            result = transcribe(
                request["audioPath"],
                request.get("preferredLanguage", "auto"),
                request.get("vocabulary"),
            )
            print(json.dumps({"requestId": request_id, **result}), flush=True)
        except Exception as error:
            traceback.print_exc(file=sys.stderr)
            print(json.dumps({"requestId": request_id, "error": str(error)}), flush=True)


if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1] == "--worker":
        run_worker()
    elif len(sys.argv) == 2:
        main(sys.argv[1])
    else:
        raise SystemExit("usage: transcribe.py AUDIO_FILE")
