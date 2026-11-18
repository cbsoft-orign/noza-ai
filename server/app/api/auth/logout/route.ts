import { NextResponse } from 'next/server';
import { SHOP_SESSION_COOKIE } from '@/lib/shop-session';

export async function POST() {
  const response = NextResponse.json({ ok: true, authenticated: false });
  response.cookies.set(SHOP_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
