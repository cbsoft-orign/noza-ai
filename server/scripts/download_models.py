import json
import os

import whisper
from huggingface_hub import snapshot_download

whisper.load_model(
    os.environ.get("WHISPER_MODEL_NAME", "base"),
    device="cpu",
    download_root=os.environ.get(
        "WHISPER_CACHE_DIR", os.path.join(os.path.expanduser("~"), ".cache", "whisper")
    ),
)

model_path = snapshot_download(
    repo_id="emmilly/kinyarwanda-standard-asr-whisper-small_rw_stage1-cvafv-aug_s42",
    revision="2717767f6e152ff76bd5f6e76bee942cc8795419",
    allow_patterns=["*.json", "*.safetensors", "README.md"],
    max_workers=1,
    local_dir=os.environ.get(
        "KINYARWANDA_MODEL_PATH",
        os.path.join(os.path.expanduser("~"), ".cache", "noza-ai", "kinyarwanda-model"),
    ),
)

processor_config_path = os.path.join(model_path, "processor_config.json")
preprocessor_config_path = os.path.join(model_path, "preprocessor_config.json")
if not os.path.isfile(preprocessor_config_path) and os.path.isfile(processor_config_path):
    with open(processor_config_path, encoding="utf-8") as processor_config_file:
        processor_config = json.load(processor_config_file)
    feature_extractor_config = processor_config.get("feature_extractor")
    if not isinstance(feature_extractor_config, dict):
        raise RuntimeError(
            f"Feature extractor configuration is missing from {processor_config_path}."
        )
    with open(preprocessor_config_path, "w", encoding="utf-8") as preprocessor_config_file:
        json.dump(feature_extractor_config, preprocessor_config_file, indent=2)

if not os.path.isfile(os.path.join(model_path, "model.safetensors")):
    raise RuntimeError(
        f"Kinyarwanda model weights are missing from {model_path}. "
        "Check the Hugging Face download and run this script again."
    )
if not os.path.isfile(preprocessor_config_path):
    raise RuntimeError(
        f"Feature extractor configuration is missing from {model_path}. "
        "Check the Hugging Face download and run this script again."
    )
