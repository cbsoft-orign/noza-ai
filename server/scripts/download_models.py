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

snapshot_download(
    repo_id="emmilly/kinyarwanda-standard-asr-whisper-small_rw_stage1-cvafv-aug_s42",
    revision="2717767f6e152ff76bd5f6e76bee942cc8795419",
    allow_patterns=["*.json", "*.safetensors", "README.md"],
    max_workers=1,
    local_dir=os.environ.get(
        "KINYARWANDA_MODEL_PATH",
        os.path.join(os.path.expanduser("~"), ".cache", "noza-ai", "kinyarwanda-model"),
    ),
)
