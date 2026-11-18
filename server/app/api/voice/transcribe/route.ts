import { NextResponse, type NextRequest } from 'next/server';
import { parseMessageText } from '@/lib/intent';
import { generateVoiceNote, transcribeAudioBuffer, transcribeAudioFromUrl } from '@/lib/voice';
import { db } from '@/lib/store';
import { readShopSession } from '@/lib/shop-session';

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      if (!readShopSession(request)) {
        return NextResponse.json({ ok: false, message: 'Session expired. Please sign in again.' }, { status: 401 });
      }
      const formData = await request.formData();
      const audio = formData.get('audio');
      if (!(audio instanceof File)) {
        return NextResponse.json({ ok: false, message: 'Audio file required.' }, { status: 400 });
      }
      if (audio.size === 0 || audio.size > 25 * 1024 * 1024) {
        return NextResponse.json({ ok: false, message: 'Audio must be between 1 byte and 25 MB.' }, { status: 413 });
      }
      const extension = audio.name.split('.').pop() || 'webm';
      const transcript = await transcribeAudioBuffer(Buffer.from(await audio.arrayBuffer()), extension);
      return NextResponse.json({ ok: true, transcript });
    }

    const body = await request.json();
    const phone = String(body.phone ?? '250788000001');
    const mediaUrl = String(body.audioUrl ?? '');
    const shop = db.shops.find((entry) => entry.phone === phone) ?? db.shops[0];

    if (!mediaUrl) {
      return NextResponse.json({ ok: false, message: 'audioUrl required' }, { status: 400 });
    }

    const text = await transcribeAudioFromUrl(mediaUrl);
    const response = shop ? parseMessageText(shop.id, text) : 'Muraho. Andika STOCK cyangwa Gurisha umuceri 2';
    const voiceNote = await generateVoiceNote(response);

    return NextResponse.json({ ok: true, transcript: text, response, voiceNote: Boolean(voiceNote) });
  } catch (error) {
    console.error('Transcribe route failed', error);
    const message = error instanceof Error && (
      error.message.startsWith('Python 3.10+') ||
      error.message.startsWith('FFmpeg is required')
    ) ? error.message : 'Voice transcription failed. Check the backend logs.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
