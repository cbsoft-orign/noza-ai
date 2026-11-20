# STOCK AI Backend

Minimal Next.js 14 backend for a WhatsApp + voice stock manager for Rwanda.

## Stack
- Next.js 14 App Router
- Supabase Postgres
- WhatsApp Cloud API
- Browser-based Kinyarwanda ASR in the Vite client

## Features in this MVP
1. Shop onboarding and WhatsApp registration
2. Stock, sell, product creation, price updates, and restocking command parsing
3. Daily sales report cron
4. Voice transcription flow
5. Payment + plan gating

## Local setup
1. Copy `.env.example` to `.env.local`
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` using the server-only secret/service-role key from Supabase Project Settings → API Keys. Do not use the publishable/anon key here or expose the service-role key to the frontend. Fill in WhatsApp variables as needed.
3. Install Node dependencies and run the backend:
   ```powershell
   npm install
   npm run dev
   ```

The development server writes to `.next-dev`, separate from production builds in `.next`, so running `npm run build` does not replace files used by a running dev server. Restart an already-running dev server once after updating this configuration.

The POS and dashboard use the Kinyarwanda-specific `OpenVoiceOS/w2v-bert-2.0-kinyarwanda-onnx` int8 model in a browser Web Worker. Its approximately 584 MB model file is downloaded once and cached in browser storage; transcription runs locally and microphone audio is not uploaded. The model is an ONNX export of `badrex/w2v-bert-2.0-kinyarwanda-asr` and is licensed CC-BY-4.0. Attribution: Badr M. Abdullah / ASRwanda team and Digital Umuganda; ONNX export by OpenVoiceOS. The browser also downloads the small feature-extractor configuration from Hugging Face. No Python installation, Hugging Face token, or transcription API key is required. Only recognized text is sent to the authenticated server command endpoint. WhatsApp voice notes are not transcribed; use the signed-in browser microphone or send text commands.

For an existing Supabase database, apply `supabase/migrations/20261119_extend_product_units.sql` in the Supabase SQL Editor before using the additional product units. It also corrects common existing product units, including Ibirayi to kg.

## Key endpoints
- `GET /api/health`
- `GET /api/whatsapp/webhook`
- `POST /api/whatsapp/webhook`
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
- The dashboard and POS microphone use the same Kinyarwanda-trained ONNX model. Audio is decoded to mono 16 kHz in the browser, then locally transcribed in a Web Worker. The model is cached in browser storage; the first download is large, and CPU inference may take several seconds. Browser microphone access requires HTTPS or localhost.
- The POS microphone treats a product plus quantity (for example, “Umuceri ibiro bibiri”) as a sale; the general dashboard assistant requires an explicit action such as “Gurisha umuceri ibiro bibiri.” Typed commands retain their explicit action requirement.

## Render health ping
The `server/render.yaml` Blueprint defines a Render Cron Job that calls the health URL every five minutes. Set its `HEALTH_URL` environment variable in Render to your deployed service URL, for example `https://your-service.onrender.com/api/health`. The cron job fails visibly in its logs if the request fails.

## Render frontend connection
For a frontend hosted separately from the backend, set `VITE_API_URL` in the frontend Render service to the backend's base URL (for example, `https://your-backend.onrender.com`, without a trailing slash). Set the backend's `CORS_ORIGINS` environment variable to the exact frontend origin (for example, `https://your-frontend.onrender.com`, without a path or trailing slash). Multiple origins can be comma-separated. The backend uses credentialed CORS so the frontend's session cookie works; do not use `*` as an allowed origin.

The Blueprint builds the Node.js backend from `server/Dockerfile`. Transcription inference and model downloads happen in each user's browser, not in this service.
