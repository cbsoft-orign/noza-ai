import { createHmac, timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';

export const SHOP_SESSION_COOKIE = 'noza_shop_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

type ShopSession = {
  shopId: string;
  phone: string;
  expiresAt: number;
};

function secret() {
  return process.env.SHOP_SESSION_SECRET || 'noza-development-session-secret';
}

export function createShopSession(shopId: string, phone: string) {
  const payload = Buffer.from(JSON.stringify({
    shopId,
    phone,
    expiresAt: Date.now() + SESSION_TTL_MS,
  })).toString('base64url');
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function readShopSession(request: NextRequest): ShopSession | null {
  const value = request.cookies.get(SHOP_SESSION_COOKIE)?.value;
  if (!value) return null;
  const separator = value.lastIndexOf('.');
  if (separator < 1) return null;

  const payload = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url');

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as ShopSession;
    if (!session.shopId || !session.phone || session.expiresAt <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function shopSessionCookie(value: string) {
  return {
    name: SHOP_SESSION_COOKIE,
    value,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  };
}
