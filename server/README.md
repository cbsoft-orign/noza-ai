# STOCK AI Backend

Minimal Next.js 14 backend for a WhatsApp + voice stock manager for Rwanda.

## Stack
- Next.js 14 App Router
- Supabase Postgres
- WhatsApp Cloud API
- Local OpenAI Whisper with a locally cached Kinyarwanda fine-tuned fallback
- Google Cloud TTS

## Features in this MVP
1. Shop onboarding and WhatsApp registration
2. Stock, sell, product creation, price updates, and restocking command parsing
3. Daily sales report cron
4. Voice transcription flow
5. Payment + plan gating

## Local setup
1. Copy `.env.example` to `.env.local`
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` using the server-only secret/service-role key from Supabase Project Settings → API Keys. Do not use the publishable/anon key here or expose the service-role key to the frontend. Fill in WhatsApp and optional Google Cloud variables. Transcription requires no API key; Kinyarwanda model weights are downloaded once and cached locally.
3. Install Node dependencies. For Windows, install Python 3.10+ and FFmpeg, then create the Python environment:
   ```powershell
   npm install
   py -3.11 -m venv .venv
   .\.venv\Scripts\python.exe -m pip install --upgrade pip
   .\.venv\Scripts\python.exe -m pip install "setuptools<81" wheel
   .\.venv\Scripts\python.exe -m pip install --index-url https://download.pytorch.org/whl/cpu torch==2.6.0+cpu
   .\.venv\Scripts\python.exe -m pip install --no-build-isolation -r requirements.txt
   ```
4. Download and cache the local Whisper and Kinyarwanda models:
   ```powershell
   $env:HF_HUB_DOWNLOAD_TIMEOUT = "120"
   $env:HF_HUB_DISABLE_XET = "1"
   .\.venv\Scripts\python.exe scripts\download_models.py
   ```
   On macOS/Linux, use `python3 -m pip` and `python3 scripts/download_models.py` instead. The backend automatically uses `server\.venv\Scripts\python.exe` on Windows; otherwise set `PYTHON_BIN` to your Python executable.
   This is a one-time download of the model weights; no Hugging Face token or paid inference endpoint is needed. If transcription reports that the Kinyarwanda model files or feature-extractor configuration are missing, rerun the download command from the `server` directory.
5. Run the app:
   npm run dev

The development server writes to `.next-dev`, separate from production builds in `.next`, so running `npm run build` does not replace files used by a running dev server. Restart an already-running dev server once after updating this configuration.

For an existing Supabase database, apply `supabase/migrations/20261119_extend_product_units.sql` in the Supabase SQL Editor before using the additional product units. It also corrects common existing product units, including Ibirayi to kg.

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
- Products support weight, volume, and common retail packaging/count units. Product entry suggests a unit for common names (for example, ibirayi → kg), but staff should confirm the unit used to buy and sell each item. Discrete units such as pieces, bottles, and loaves require whole-number stock and sale quantities.
- Restock existing products from Inventory with the product's saved unit; voice stock commands also require an existing product so stock is not created with an invented unit or missing prices.
- POS voice and text commands share the same authenticated parser. Examples: `Gurisha umuceri ibiro 2`, `Ongeraho isukari kg 5`, `Kora igicuruzwa gishya ibirayi, kg, stock 10, kugura 500, kugurisha 700`, `Hindura igiciro cyo kugura umuceri 1500`, and `Hindura igiciro cyo kugurisha umuceri 1800`. New products require a name and both prices; unit suggestions are used only when no unit is spoken. Price and inventory commands require an unambiguous product name.
- The dashboard and POS web microphone upload recordings to `POST /api/voice/transcribe` for local transcription, then execute the recognized command through the authenticated `POST /api/voice/command` endpoint. These Kinyarwanda voice controls send `language=rw` so short shop commands go directly to the Kinyarwanda fine-tune instead of relying on automatic language detection. The transcription prompt includes the active shop's product names. Other callers can omit `language` or send `language=auto`; browser microphone access requires HTTPS or localhost.
- Kinyarwanda decoding is primed with common shop words and quantities, and transcription output removes leaked Whisper control tokens. The POS microphone treats a product plus quantity (for example, “Umuceri ibiro bibiri”) as a sale; the general dashboard assistant requires an explicit action such as “Gurisha umuceri ibiro bibiri.” Typed commands retain their explicit action requirement.
- The local transcription worker keeps models loaded in memory between requests after the first transcription. The first request has a cold-start delay; Kinyarwanda-selected recordings load only the Kinyarwanda fine-tune, while automatic mode loads the general Whisper model for language detection and high-confidence English/French, and uses the Kinyarwanda model for Swahili or uncertain detections. Automatic mode may reduce Swahili accuracy.
- The Kinyarwanda model card reports different word-error rates across datasets (9.2% on AfriVoice and 30.0% on Common Voice), so 95% accuracy cannot be guaranteed for every speaker, microphone, or recording condition.

## Render health ping
The `server/render.yaml` Blueprint defines a Render Cron Job that calls the health URL every five minutes. Set its `HEALTH_URL` environment variable in Render to your deployed service URL, for example `https://your-service.onrender.com/api/health`. The cron job fails visibly in its logs if the request fails.

## Render frontend connection
For a frontend hosted separately from the backend, set `VITE_API_URL` in the frontend Render service to the backend's base URL (for example, `https://your-backend.onrender.com`, without a trailing slash). Set the backend's `CORS_ORIGINS` environment variable to the exact frontend origin (for example, `https://your-frontend.onrender.com`, without a path or trailing slash). Multiple origins can be comma-separated. The backend uses credentialed CORS so the frontend's session cookie works; do not use `*` as an allowed origin.

The Blueprint builds the web service from `server/Dockerfile`. The image installs FFmpeg and caches the local Whisper base model and Kinyarwanda fine-tune during build. The Kinyarwanda weights are not served by Hugging Face's free shared inference provider, so this app runs them locally and does not require an inference API key or endpoint. The models must be downloaded during setup or image build and need sufficient local memory.

Local inference needs more memory than Render's free web-service tier provides reliably. The Blueprint selects Render's Pro plan (4 GB RAM); transcription runs on CPU. To avoid paid hosted inference, run the backend on a computer with sufficient memory, or account for the hosting provider's cost.

The Kinyarwanda model is [Emmilly's Kinyarwanda Whisper-small fine-tune](https://huggingface.co/emmilly/kinyarwanda-standard-asr-whisper-small_rw_stage1-cvafv-aug_s42), licensed CC BY 4.0. OpenAI Whisper is MIT-licensed. Keep this attribution when redistributing the deployment image.
