import { NextResponse } from 'next/server';
import { parseMessageText } from '@/lib/intent';
import { generateVoiceNote, transcribeAudioFromUrl } from '@/lib/voice';
import { db } from '@/lib/store';

export async function POST(request: Request) {
  try {
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
    return NextResponse.json({ ok: false, error: 'voice transcription failed' }, { status: 500 });
  }
}
