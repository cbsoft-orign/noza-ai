FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    HF_HOME=/opt/huggingface \
    HF_HUB_DOWNLOAD_TIMEOUT=120 \
    HF_HUB_DISABLE_XET=1 \
    WHISPER_CACHE_DIR=/opt/whisper-cache \
    WHISPER_MODEL_NAME=base \
    KINYARWANDA_MODEL_PATH=/opt/huggingface/kinyarwanda-model \
    PYTHON_BIN=/opt/venv/bin/python \
    PORT=3001 \
    TOKENIZERS_PARALLELISM=false \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY requirements.txt ./
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.6.0+cpu \
    && /opt/venv/bin/pip install --no-cache-dir 'setuptools<81' wheel \
    && /opt/venv/bin/pip install --no-cache-dir --no-build-isolation -r requirements.txt

COPY . .
RUN /opt/venv/bin/python scripts/download_models.py \
    && npm run build

EXPOSE 3001
CMD ["npm", "start"]
