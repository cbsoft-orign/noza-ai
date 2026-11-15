import { env } from '@/lib/env';

export async function sendWhatsAppText(phone: string, message: string) {
  if (!env.whatsappTokenSecret) {
    return { ok: true, demo: true, phone, message };
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'text',
    text: { body: message },
  };

  const response = await fetch(`https://graph.facebook.com/v19.0/${env.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.whatsappTokenSecret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return { ok: response.ok, phone, message, status: response.status };
}

export function verifyWebhookToken(mode: string | null, token: string | null) {
  return mode === 'subscribe' && token === env.whatsappToken;
}
