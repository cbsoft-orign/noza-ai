import { NextResponse, type NextRequest } from 'next/server';
import { readShopSession } from '@/lib/shop-session';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const session = readShopSession(request);
  if (!session || !supabase) {
    return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });
  }

  const { data: shop } = await supabase.from('shops').select('*').eq('id', session.shopId).eq('phone', session.phone).maybeSingle();
  if (!shop) return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });

  const { data: user } = await supabase.from('users').select('*').eq('shop_id', shop.id).eq('phone', session.phone).maybeSingle();
  return NextResponse.json({
    ok: true,
    authenticated: true,
    shop,
    user: user ?? { id: '', shop_id: shop.id, phone: session.phone, role: 'owner', name: shop.name },
  });
}
