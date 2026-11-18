import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { normalizePhone } from '@/lib/store';
import { createShopSession, shopSessionCookie } from '@/lib/shop-session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizePhone(String(body.phone ?? ''));
    if (!phone) return NextResponse.json({ ok: false, message: 'Phone required' }, { status: 400 });
    if (!supabase) return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 503 });

    const { data: shop } = await supabase.from('shops').select('*').eq('phone', phone).maybeSingle();
    if (!shop) return NextResponse.json({ ok: false, message: 'Shop not found' }, { status: 404 });

    const { data: user } = await supabase.from('users').select('*').eq('shop_id', shop.id).eq('phone', phone).maybeSingle();
    const response = NextResponse.json({
      ok: true,
      shop,
      user: user ?? { id: '', shop_id: shop.id, phone, role: 'owner', name: shop.name },
    });
    response.cookies.set(shopSessionCookie(createShopSession(shop.id, phone)));
    return response;
  } catch (error) {
    console.error('Login failed', error);
    return NextResponse.json({ ok: false, message: 'Login failed' }, { status: 500 });
  }
}
