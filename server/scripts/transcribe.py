import gc
import json
import os
import sys

import torch
import whisper


SWAHILI_CONFIDENCE_THRESHOLD = 0.75
SUPPORTED_CONFIDENCE_THRESHOLD = 0.55


def main(audio_path):
    torch.set_num_threads(1)
    model = whisper.load_model(
        os.environ.get("WHISPER_MODEL_NAME", "base"),
        device="cpu",
        download_root=os.environ.get(
            "WHISPER_CACHE_DIR", os.path.join(os.path.expanduser("~"), ".cache", "whisper")
        ),
    )
    audio = whisper.load_audio(audio_path)
    mel = whisper.log_mel_spectrogram(whisper.pad_or_trim(audio)).to(model.device)
    _, probabilities = model.detect_language(mel)
    language, confidence = max(probabilities.items(), key=lambda item: item[1])

    use_whisper = (
        language in {"en", "fr"} and confidence >= SUPPORTED_CONFIDENCE_THRESHOLD
    ) or (language == "sw" and confidence >= SWAHILI_CONFIDENCE_THRESHOLD)

    if use_whisper:
        result = model.transcribe(audio_path, language=language, fp16=False)
        text = result["text"].strip()
    else:
        del model
        gc.collect()
        from transformers import pipeline

        recognizer = pipeline(
            "automatic-speech-recognition",
            model=os.environ.get(
                "KINYARWANDA_MODEL_PATH",
                os.path.join(os.path.expanduser("~"), ".cache", "noza-ai", "kinyarwanda-model"),
            ),
            device=-1,
            # This fine-tune uses Whisper's Swahili token for Kinyarwanda.
            generate_kwargs={"language": "sw", "task": "transcribe"},
        )
        result = recognizer({"raw": audio, "sampling_rate": 16000})
        text = result["text"].strip()

    print(json.dumps({"text": text, "detectedLanguage": language}))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: transcribe.py AUDIO_FILE")
    main(sys.argv[1])
