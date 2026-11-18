# STOCK AI Backend

Minimal Next.js 14 backend for a WhatsApp + voice stock manager for Rwanda.

## Stack
- Next.js 14 App Router
- Supabase Postgres
- WhatsApp Cloud API
- Local OpenAI Whisper with a Kinyarwanda fine-tuned fallback
- Google Cloud TTS

## Features in this MVP
1. Shop onboarding and WhatsApp registration
2. Stock, sell, add-product intent parsing
3. Daily sales report cron
4. Voice transcription flow
5. Payment + plan gating

## Local setup
1. Copy `.env.example` to `.env.local`
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` using the server-only secret/service-role key from Supabase Project Settings → API Keys. Do not use the publishable/anon key here or expose the service-role key to the frontend. Fill in WhatsApp and optional Google Cloud variables. Transcription does not need an OpenAI API key.
3. Install Node dependencies. For Windows, install Python 3.10+ and FFmpeg, then create the Python environment:
   ```powershell
   npm install
   py -3.11 -m venv .venv
   .\.venv\Scripts\python.exe -m pip install --upgrade pip
   .\.venv\Scripts\python.exe -m pip install "setuptools<81" wheel
   .\.venv\Scripts\python.exe -m pip install --index-url https://download.pytorch.org/whl/cpu torch==2.6.0+cpu
   .\.venv\Scripts\python.exe -m pip install --no-build-isolation -r requirements.txt
   ```
4. Download the local ASR model weights:
   ```powershell
   $env:HF_HUB_DOWNLOAD_TIMEOUT = "120"
   $env:HF_HUB_DISABLE_XET = "1"
   .\.venv\Scripts\python.exe scripts\download_models.py
   ```
   On macOS/Linux, use `python3 -m pip` and `python3 scripts/download_models.py` instead. The backend automatically uses `server\.venv\Scripts\python.exe` on Windows; otherwise set `PYTHON_BIN` to your Python executable.
5. Run the app:
   npm run dev

## Key endpoints
- `GET /api/health`
- `GET /api/whatsapp/webhook`
- `POST /api/whatsapp/webhook`
- `POST /api/voice/transcribe`
- `POST /api/voice/command`
- `GET /api/catalog?village=Nyabugogo`
- `POST /api/products/from-image`
- `GET /api/cron/daily-report`
- `POST /api/payments`
- `GET /api/dashboard`

## Notes
- This project keeps the implementation intentionally lean and uses an in-memory store when Supabase is not configured.
- The free plan limit is enforced at 10 products and the messaging is kept short and Kinyarwanda-focused.
- The dashboard and POS web microphone upload recordings to `POST /api/voice/transcribe` for local Whisper transcription, then execute the recognized command through the authenticated `POST /api/voice/command` endpoint. Browser microphone access requires HTTPS or localhost.

## Render health ping
The `server/render.yaml` Blueprint defines a Render Cron Job that calls the health URL every five minutes. Set its `HEALTH_URL` environment variable in Render to your deployed service URL, for example `https://your-service.onrender.com/api/health`. The cron job fails visibly in its logs if the request fails.

The Blueprint builds the web service from `server/Dockerfile`. The image installs FFmpeg and the local Python models, so the first build downloads several gigabytes of model and runtime dependencies. The Whisper base model handles English, French, and Swahili. OpenAI Whisper does not include Kinyarwanda in its language inventory, so the app routes low-confidence or unsupported detections to a Kinyarwanda fine-tune; this routing is best-effort, especially for Kinyarwanda that Whisper confidently misidentifies as Swahili.

Local model inference needs more memory than Render's free web-service tier provides reliably. The Blueprint selects Render's Pro plan (4 GB RAM); transcription runs on CPU and can take several seconds. The image preloads model weights during its build, so API requests do not need an external AI key or model download.

The Kinyarwanda model is [Emmilly's Kinyarwanda Whisper-small fine-tune](https://huggingface.co/emmilly/kinyarwanda-standard-asr-whisper-small_rw_stage1-cvafv-aug_s42), licensed CC BY 4.0. OpenAI Whisper is MIT-licensed. Keep this attribution when redistributing the deployment image.
