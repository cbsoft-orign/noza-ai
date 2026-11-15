# STOCK AI Backend

Minimal Next.js 14 backend for a WhatsApp + voice stock manager for Rwanda.

## Stack
- Next.js 14 App Router
- Supabase Postgres
- WhatsApp Cloud API
- OpenAI Whisper
- Google Cloud TTS

## Features in this MVP
1. Shop onboarding and WhatsApp registration
2. Stock, sell, add-product intent parsing
3. Daily sales report cron
4. Voice transcription flow
5. Payment + plan gating

## Local setup
1. Copy `.env.example` to `.env.local`
2. Fill in Supabase, WhatsApp, OpenAI, and Google Cloud variables
3. Install dependencies:
   npm install
4. Run the app:
   npm run dev

## Key endpoints
- `GET /api/whatsapp/webhook`
- `POST /api/whatsapp/webhook`
- `POST /api/voice/transcribe`
- `GET /api/catalog?village=Nyabugogo`
- `POST /api/products/from-image`
- `GET /api/cron/daily-report`
- `POST /api/payments`
- `GET /api/dashboard`

## Notes
- This project keeps the implementation intentionally lean and uses an in-memory store when Supabase is not configured.
- The free plan limit is enforced at 10 products and the messaging is kept short and Kinyarwanda-focused.
