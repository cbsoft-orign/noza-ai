import { NextResponse, type NextRequest } from 'next/server';
import { parseMessageText } from '@/lib/intent';
import { generateVoiceNote, transcribeAudioBuffer, transcribeAudioFromUrl } from '@/lib/voice';
import { db } from '@/lib/store';
import { readShopSession } from '@/lib/shop-session';
import { supabase } from '@/lib/supabase';

function hideWhisperControlTokens(text: string) {
  return text.replace(/<\|[^|]*\|>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      const session = readShopSession(request);
      if (!session) {
        return NextResponse.json({ ok: false, message: 'Session expired. Please sign in again.' }, { status: 401 });
      }
      const formData = await request.formData();
      const audio = formData.get('audio');
      if (!(audio instanceof File)) {
        return NextResponse.json({ ok: false, message: 'Audio file required.' }, { status: 400 });
      }
      const requestedLanguage = formData.get('language');
      if (requestedLanguage !== null && requestedLanguage !== 'auto' && requestedLanguage !== 'rw') {
        return NextResponse.json({ ok: false, message: 'Unsupported transcription language.' }, { status: 400 });
      }
      if (audio.size === 0 || audio.size > 25 * 1024 * 1024) {
        return NextResponse.json({ ok: false, message: 'Audio must be between 1 byte and 25 MB.' }, { status: 413 });
      }
      const extension = audio.name.split('.').pop() || 'webm';
      const preferredLanguage = requestedLanguage === 'rw' ? 'rw' : 'auto';
      let vocabulary: string[] = [];
      if (supabase) {
        const { data: productRows, error } = await supabase
          .from('products')
          .select('name')
          .eq('shop_id', session.shopId)
          .limit(20);
        if (error) {
          console.error('Could not load product vocabulary for transcription', error);
          return NextResponse.json({ ok: false, message: 'Could not load shop products for voice recognition.' }, { status: 500 });
        }
        vocabulary = (productRows ?? [])
          .map((product) => product.name)
          .filter((name): name is string => typeof name === 'string');
      }
      const rawTranscript = await transcribeAudioBuffer(
        Buffer.from(await audio.arrayBuffer()),
        extension,
        preferredLanguage,
        vocabulary,
      );
      const transcript = hideWhisperControlTokens(rawTranscript);
      return NextResponse.json({ ok: true, transcript });
    }

    const body = await request.json();
    const phone = String(body.phone ?? '250788000001');
    const mediaUrl = String(body.audioUrl ?? '');
    const shop = db.shops.find((entry) => entry.phone === phone) ?? db.shops[0];

    if (!mediaUrl) {
      return NextResponse.json({ ok: false, message: 'audioUrl required' }, { status: 400 });
    }

    const text = hideWhisperControlTokens(await transcribeAudioFromUrl(mediaUrl));
    const response = shop ? parseMessageText(shop.id, text) : 'Muraho. Andika STOCK cyangwa Gurisha umuceri 2';
    const voiceNote = await generateVoiceNote(response);

    return NextResponse.json({ ok: true, transcript: text, response, voiceNote: Boolean(voiceNote) });
  } catch (error) {
    console.error('Transcribe route failed', error);
    const stderr = error instanceof Error && 'stderr' in error
      ? String(error.stderr ?? '')
      : '';
    const details = `${error instanceof Error ? error.message : ''}\n${stderr}`;
    const message = details.includes('Kinyarwanda model files are missing')
      ? 'Kinyarwanda model files are incomplete. From the server directory, run the Python scripts\\download_models.py command shown in the server README.'
      : error instanceof Error && (
        error.message.startsWith('Python 3.10+') ||
        error.message.startsWith('FFmpeg is required')
      ) ? error.message : 'Voice transcription failed. Check the backend logs.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
