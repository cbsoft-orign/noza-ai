import { NextResponse } from 'next/server';
import { createShop, getShopByPhone } from '@/lib/store';
import { detectIntent, parseMessageText, resolveShopPhone } from '@/lib/intent';
import { sendWhatsAppText, verifyWebhookToken } from '@/lib/whatsapp';
import { transcribeAudioFromUrl } from '@/lib/voice';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (verifyWebhookToken(mode, token) && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Invalid webhook token' }, { status: 401 });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const message = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) {
      return NextResponse.json({ ok: false, message: 'No message payload' }, { status: 400 });
    }

    const from = String(message.from || '').replace(/\D/g, '');
    const shop = resolveShopPhone(from) ?? getShopByPhone(from);

    if (!shop) {
      const created = createShop(from, 'New Shop', 'Nyabugogo');
      await sendWhatsAppText(from, "Murakaza neza kuri TILL! Andika izina ry'iduka");
      return NextResponse.json({ ok: true, status: 'new_shop_registered', shop: created });
    }

    let text = '';
    const type = message.type;

    if (type === 'text') {
      text = message.text?.body ?? '';
    } else if (type === 'audio' || type === 'voice') {
      const mediaId = message.audio?.id ?? message.voice?.id ?? message?.audio?.id;
      const mediaUrl = mediaId ? `https://graph.facebook.com/v19.0/${mediaId}` : null;
      if (!mediaUrl) {
        return NextResponse.json({ ok: false, message: 'Audio media ID required' }, { status: 400 });
      }
      text = await transcribeAudioFromUrl(mediaUrl);
    } else if (type === 'image') {
      text = 'Mfite ifoto ya ibicuruzwa';
    }

    const detected = detectIntent(text);
    const response = detected.intent === 'UNKNOWN'
      ? 'Ntago twasobanukiwe. Andika: STOCK, Gurisha umuceri 2, cyangwa Mfite umuceri 10'
      : parseMessageText(shop.id, text);

    await sendWhatsAppText(from, response.split('\n')[0]);

    return NextResponse.json({ ok: true, shopId: shop.id, intent: detected.intent, response, text });
  } catch (error) {
    console.error('Webhook error', error);
    return NextResponse.json({ ok: false, error: 'Webhook failed' }, { status: 500 });
  }
}
