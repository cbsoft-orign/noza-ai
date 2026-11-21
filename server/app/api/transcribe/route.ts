import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { readShopSession } from '@/lib/shop-session';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';
const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB max for Groq Whisper
const MAX_INVENTORY_ITEMS = 250;

const ACTIONS = [
  'SELL',
  'ADD_STOCK',
  'CHECK_STOCK',
  'CHECK_PRICE',
  'RECORD_DEBT',
  'PAY_DEBT',
  'RECORD_LOSS',
  'DAILY_REPORT',
  'UNKNOWN',
] as const;

const AudioCommandSchema = z.object({
  raw_text: z.string(),
  corrected_text: z.string(),
  action: z.enum(ACTIONS),
  item: z.string().nullable(),
  quantity: z.number().finite().nonnegative().nullable(),
  unit: z.string().nullable(),
  amount_rwf: z.number().finite().nonnegative().nullable(),
  customer_name: z.string().nullable(),
}).strict();

const ACCEPTED_AUDIO_TYPES = new Set([
  'audio/webm',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/ogg',
  'audio/aac',
  'audio/flac',
]);

const CANDIDATE_CHAT_MODELS = [
  process.env.GROQ_CHAT_MODEL,
  process.env.GROQ_LLAMA_MODEL,
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
].filter(Boolean) as string[];

let cachedWorkingChatModel: string | null = null;

async function requestChatNormalization(systemPrompt: string, userPayload: unknown) {
  const modelsToTry = cachedWorkingChatModel
    ? [cachedWorkingChatModel, ...CANDIDATE_CHAT_MODELS.filter((m) => m !== cachedWorkingChatModel)]
    : CANDIDATE_CHAT_MODELS;

  let lastResponse: Response | null = null;
  let lastErrorText = '';

  for (const model of modelsToTry) {
    const response = await groqRequest(
      '/chat/completions',
      JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(userPayload) },
        ],
      }),
      'application/json'
    );

    if (response.ok) {
      cachedWorkingChatModel = model;
      return { ok: true as const, response, model };
    }

    lastResponse = response;
    lastErrorText = await response.text().catch(() => '');

    const isModelNotFound =
      response.status === 404 ||
      lastErrorText.includes('model_not_found') ||
      lastErrorText.includes('does not exist') ||
      lastErrorText.includes('do not have access');

    if (isModelNotFound) {
      console.warn(`Groq model "${model}" not available (${response.status}), falling back to next candidate...`);
      continue;
    }

    break;
  }

  return { ok: false as const, response: lastResponse, errorText: lastErrorText };
}

function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin') ?? '';
  const configured = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const isAllowed =
    !origin ||
    configured.includes(origin) ||
    origin === 'https://noza-ai.vercel.app' ||
    /^https:\/\/[a-z0-9-]+(?:\.vercel\.app|\.render\.com)$/i.test(origin) ||
    /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin);

  const allowedOrigin = isAllowed ? origin : (configured[0] ?? '*');

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

function estimatePromptTokens(value: string): number {
  return value
    .split(/\s+/)
    .reduce((total, word) => total + Math.max(1, Math.ceil(word.length / 4)), 0);
}

function buildWhisperPrompt(inventory: string[]): string {
  const top15 = inventory
    .slice(0, 15)
    .map((item) => item.replace(/[\r\n,]/g, ' ').trim().slice(0, 40))
    .filter(Boolean);

  const inventoryString = top15.length > 0 ? top15.join(', ') + '.' : '';

  let prompt = [
    "Gurisha, ongera, shyiramo, kura muri stock, reba stock, hasigaye angahe, igiciro ni angahe, ideni, yishyuye, raporo y'umunsi, byangiritse.",
    inventoryString,
    'Ikiro kimwe, ibiro bibiri, bitatu, bine, bitanu, icumi, litiro imwe, ikarito, ipaki, icupa, agafuka, carton, sachet.',
    'Amafaranga magana atanu, igihumbi, ibihumbi bibiri, bitanu, icumi.',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Groq Whisper prompt strictly under 200 tokens
  if (estimatePromptTokens(prompt) > 195) {
    const trimmed = [...top15];
    while (trimmed.length > 0) {
      trimmed.pop();
      const subInv = trimmed.length > 0 ? trimmed.join(', ') + '.' : '';
      const candidate = [
        "Gurisha, ongera, shyiramo, kura muri stock, reba stock, hasigaye angahe, igiciro ni angahe, ideni, yishyuye, raporo y'umunsi, byangiritse.",
        subInv,
        'Ikiro kimwe, ibiro bibiri, bitatu, bine, bitanu, icumi, litiro imwe, ikarito, ipaki, icupa, agafuka, carton, sachet.',
        'Amafaranga magana atanu, igihumbi, ibihumbi bibiri, bitanu, icumi.',
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (estimatePromptTokens(candidate) <= 195) {
        return candidate;
      }
    }
  }

  return prompt;
}

function normalizeProductName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseInventory(value: FormDataEntryValue | null): string[] {
  if (value === null) return [];
  if (typeof value !== 'string') throw new Error('Inventory must be a JSON string array.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('Inventory must be a valid JSON string array.');
  }
  if (
    !Array.isArray(parsed) ||
    parsed.length > MAX_INVENTORY_ITEMS ||
    parsed.some((item) => typeof item !== 'string' || item.length > 100)
  ) {
    throw new Error('Inventory must contain a JSON string array of up to 250 product names.');
  }
  return parsed.map((item) => item.trim()).filter(Boolean);
}

function isAcceptedAudio(file: File): boolean {
  const mimeType = file.type.toLowerCase().split(';')[0].trim();
  if (ACCEPTED_AUDIO_TYPES.has(mimeType)) return true;
  return /\.(webm|wav|mp3|m4a|ogg|mp4|aac|flac)$/i.test(file.name);
}

async function groqRequest(path: string, body: FormData | string, contentType?: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);
  try {
    return await fetch(`${GROQ_API_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        ...(contentType ? { 'Content-Type': contentType } : {}),
      },
      body,
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      {
        ok: false,
        message: 'GROQ_API_KEY is not set on the Render environment. Please add it to your Render service environment variables.',
      },
      { status: 503, headers: corsHeaders }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Expected multipart/form-data containing audio.' },
      { status: 400, headers: corsHeaders }
    );
  }

  const audio = form.get('audio');
  if (!(audio instanceof File)) {
    return NextResponse.json(
      { ok: false, message: 'An audio file is required in the "audio" form field.' },
      { status: 400, headers: corsHeaders }
    );
  }

  if (!audio.size || audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { ok: false, message: 'Audio file must be between 1 byte and 25 MB.' },
      { status: 413, headers: corsHeaders }
    );
  }

  if (!isAcceptedAudio(audio)) {
    return NextResponse.json(
      { ok: false, message: 'Audio must be a valid audio file (webm, wav, mp3, m4a, ogg).' },
      { status: 415, headers: corsHeaders }
    );
  }

  let requestedInventory: string[] = [];
  try {
    requestedInventory = parseInventory(form.get('inventory'));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'Invalid inventory payload.',
      },
      { status: 400, headers: corsHeaders }
    );
  }

  // Attempt to enrich inventory from Supabase if shop session exists
  let databaseInventory: string[] = [];
  try {
    const shopSession = readShopSession(request);
    if (shopSession && supabase) {
      const { data: productRows } = await supabase
        .from('products')
        .select('name')
        .eq('shop_id', shopSession.shopId);
      databaseInventory = (productRows ?? []).map((p) => p.name).filter(Boolean);
    }
  } catch {
    // Graceful fallback to client-supplied inventory
  }

  // Combine and deduplicate inventory list
  const combinedInventory = [
    ...databaseInventory,
    ...requestedInventory,
  ].filter((name, index, list) => {
    const norm = normalizeProductName(name);
    return list.findIndex((item) => normalizeProductName(item) === norm) === index;
  });

  try {
    // =========================================================================
    // Stage 1: Guided Groq Whisper (whisper-large-v3)
    // =========================================================================
    const whisperPrompt = buildWhisperPrompt(combinedInventory);

    const transcriptionForm = new FormData();
    transcriptionForm.append(
      'file',
      new Blob([await audio.arrayBuffer()], {
        type: audio.type || 'application/octet-stream',
      }),
      audio.name || 'voice-command.webm'
    );
    transcriptionForm.append('model', 'whisper-large-v3');
    transcriptionForm.append('language', 'sw'); // Closest Bantu phonetic proxy for Kinyarwanda
    transcriptionForm.append('prompt', whisperPrompt);
    transcriptionForm.append('response_format', 'json');

    const whisperResponse = await groqRequest('/audio/transcriptions', transcriptionForm);

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text().catch(() => '');
      console.error('Groq Whisper transcription failed', {
        status: whisperResponse.status,
        body: errorText,
      });
      return NextResponse.json(
        {
          ok: false,
          message:
            whisperResponse.status === 429
              ? 'Groq voice service is currently rate limited. Please wait a moment and try again.'
              : 'Could not transcribe the audio. Please try again.',
        },
        {
          status: whisperResponse.status === 429 ? 503 : 502,
          headers: corsHeaders,
        }
      );
    }

    const whisperResult = (await whisperResponse.json()) as { text?: unknown };
    if (typeof whisperResult.text !== 'string' || !whisperResult.text.trim()) {
      return NextResponse.json(
        { ok: false, message: 'No speech was recognized. Please speak clearly and try again.' },
        { status: 422, headers: corsHeaders }
      );
    }

    const rawTranscript = whisperResult.text.trim();

    // =========================================================================
    // Stage 2: Groq Llama 3.3 Command Normalization & Extraction (llama-3.3-70b-versatile)
    // =========================================================================
    const systemPrompt = `You are an expert Rwandan retail shop (duka) speech normalization and command extraction engine.
You process speech transcripts spoken in Kinyarwanda, with frequent Kinyarwanda-French-English code-switching common in Rwandan shops.

INPUTS:
- transcript: The raw speech transcript from Whisper (which may have phonetic Bantu spelling errors).
- inventory: JSON array of exact product names available in this shop.

REQUIREMENTS:
1. Phonetic Spelling Correction:
   - Fix Whisper phonetic spelling errors:
     * "umucheri", "umukyeli", "mchere" -> "umuceri"
     * "isukali", "sukari" -> "isukari"
     * "kawunga", "kaunga" -> "kawunga"
     * "amata", "maziwa" -> "amata"
     * "amavuta", "mafuta" -> "amavuta"
     * "ibishyimbo" -> "ibishyimbo"
     * "isabune" -> "isabune"
     * "fanta", "fata" (when used as beverage) -> "Fanta"
     * "primus", "mutzig", "skol" -> matching beverage name
   - Put the cleaned, human-readable sentence into "corrected_text".

2. Exact Inventory Matching:
   - Match spoken product names to the closest item in the provided inventory list.
   - If a match is found in inventory, use the exact name from the inventory list in "item".
   - If the item is not in inventory or inventory is empty, set "item" to the normalized spoken item name or null.

3. Number Words Conversion:
   - Convert Kinyarwanda and French number words into numeric digits for "quantity" and "amount_rwf":
     * Kinyarwanda: kimwe / rimwe = 1, bibiri / kabiri = 2, bitatu / gatatu = 3, bine / kane = 4, bitanu / gatanu = 5, gatandatu = 6, karindwi = 7, umunani = 8, icyenda = 9, icumi = 10
     * Multiples: makumyabiri = 20, mirongo itatu = 30, mirongo ine = 40, mirongo itanu = 50, ijana = 100, magana abiri = 200, magana atanu = 500
     * Thousands: igihumbi = 1000, ibihumbi bibiri / bibili = 2000, ibihumbi bitatu = 3000, ibihumbi bitanu = 5000, ibihumbi icumi = 10000
     * French: un = 1, deux = 2, trois = 3, quatre = 4, cinq = 5, six = 6, sept = 7, huit = 8, neuf = 9, dix = 10
     * Code-switching examples: "gurisha umuceri deux kilos" -> quantity: 2, unit: "kg"; "ongera carton ebyiri za fanta" -> quantity: 2, unit: "carton"

4. Action Classification:
   Classify the command into EXACTLY ONE of these action codes:
   - SELL: Spoken cues include gurisha, tanga, agize, ndagurishije, mfata, vend, sale. (e.g. "gurisha umuceri ibiro bibiri", "gurisha umuceri deux kilos")
   - ADD_STOCK: Spoken cues include ongera, shyiramo, ndaranguye, injiza, byinjiye, stock, rajoute. (e.g. "ongera carton ebyiri za fanta", "shyiramo amavuta litiro eshanu")
   - CHECK_STOCK: Spoken cues include reba stock, hasigaye angahe, ese dufite, ibisigaye, combien reste, check stock. (e.g. "reba stock y'isukari", "hasigaye fanta zingahe")
   - CHECK_PRICE: Spoken cues include igiciro, ni angahe, bigura angahe, prix, c'est combien. (e.g. "igiciro cy'amavuta ni angahe", "umuceri ugura angahe")
   - RECORD_DEBT: Spoken cues include ideni, andika ideni, yatwaye ku ideni, credit, dette. (e.g. "yatwaye isukari ku ideni", "andika ideni rya Jean ibihumbi bitanu")
   - PAY_DEBT: Spoken cues include yishyuye ideni, yishyuye, ampaye, remboursé, pay debt. (e.g. "Kamanzi yishyuye ideni ibihumbi bibiri", "yishyuye amafaranga")
   - RECORD_LOSS: Spoken cues include byangiritse, byamenetse, sohora amafaranga, cassé, perte, damaged. (e.g. "byangiritse amata litiro imwe", "icupa ryamenetse")
   - DAILY_REPORT: Spoken cues include raporo y'umunsi, inyungu, twacuruje angahe, rapport, bilan. (e.g. "raporo y'umunsi", "twacuruje angahe uyu munsi")
   - UNKNOWN: Spoken audio is unrelated, greeting, unintelligible, or intent cannot be determined.

5. Strict Output JSON Schema:
Return ONLY a valid JSON object matching this schema:
{
  "raw_text": "${rawTranscript.replace(/"/g, '\\"')}",
  "corrected_text": "string",
  "action": "SELL | ADD_STOCK | CHECK_STOCK | CHECK_PRICE | RECORD_DEBT | PAY_DEBT | RECORD_LOSS | DAILY_REPORT | UNKNOWN",
  "item": "string | null",
  "quantity": "number | null",
  "unit": "string | null",
  "amount_rwf": "number | null",
  "customer_name": "string | null"
}`;

    const normalizationResult = await requestChatNormalization(systemPrompt, {
      transcript: rawTranscript,
      inventory: combinedInventory,
    });

    if (!normalizationResult.ok || !normalizationResult.response) {
      console.error('Groq command normalization failed across candidate models', {
        status: normalizationResult.response?.status,
        body: normalizationResult.errorText,
      });
      return NextResponse.json(
        {
          ok: false,
          message:
            normalizationResult.response?.status === 429
              ? 'Groq command normalization is busy. Please wait a moment and try again.'
              : 'Could not understand the shop command. Please try again.',
        },
        {
          status: normalizationResult.response?.status === 429 ? 503 : 502,
          headers: corsHeaders,
        }
      );
    }

    const completion = (await normalizationResult.response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = completion.choices?.[0]?.message?.content;

    if (typeof content !== 'string') {
      return NextResponse.json(
        { ok: false, message: 'Groq returned an empty response. Please try again.' },
        { status: 502, headers: corsHeaders }
      );
    }

    let parsedCommand: unknown;
    try {
      parsedCommand = JSON.parse(content);
    } catch {
      console.error('Groq returned invalid JSON', content);
      return NextResponse.json(
        { ok: false, message: 'Invalid structured response from AI model.' },
        { status: 502, headers: corsHeaders }
      );
    }

    const validated = AudioCommandSchema.safeParse(parsedCommand);
    if (!validated.success) {
      console.error('Groq returned schema violation', validated.error);
      return NextResponse.json(
        { ok: false, message: 'AI returned a command format error. Please try again.' },
        { status: 502, headers: corsHeaders }
      );
    }

    const command = validated.data;

    // Harmonize item name with inventory if matched
    if (command.item && combinedInventory.length > 0) {
      const matched = combinedInventory.find(
        (name) => normalizeProductName(name) === normalizeProductName(command.item ?? '')
      );
      if (matched) {
        command.item = matched;
      }
    }

    return NextResponse.json(
      {
        ok: true,
        raw_text: rawTranscript,
        corrected_text: command.corrected_text || rawTranscript,
        action: command.action,
        item: command.item,
        quantity: command.quantity,
        unit: command.unit,
        amount_rwf: command.amount_rwf,
        customer_name: command.customer_name,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    console.error('Voice transcription pipeline error', isTimeout ? 'timeout' : error);
    return NextResponse.json(
      {
        ok: false,
        message: isTimeout
          ? 'Voice processing timed out. The server or AI service may be waking up; please try again.'
          : 'Voice processing failed. Please try again.',
      },
      { status: isTimeout ? 504 : 502, headers: corsHeaders }
    );
  }
}
