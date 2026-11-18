import { NextResponse } from 'next/server';
import { addProduct, db, getProductsByShop, isFreePlanExceeded } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { readShopSession } from '@/lib/shop-session';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const auth = readShopSession(request);
  if (!auth) return NextResponse.json({ ok: false, message: 'Session expired. Please sign in again.' }, { status: 401 });
  const url = new URL(request.url);
  const shopId = url.searchParams.get('shop_id');
  if (!shopId) return NextResponse.json({ ok: false, message: 'shop_id required' }, { status: 400 });
  if (shopId !== auth.shopId) return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  if (!supabase) return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 503 });
  const { data, error } = await supabase.from('products').select('*').eq('shop_id', shopId).order('name');
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, items: data ?? [] });
}

export async function POST(request: NextRequest) {
  try {
    const auth = readShopSession(request);
    if (!auth) return NextResponse.json({ ok: false, message: 'Session expired. Please sign in again.' }, { status: 401 });
    const body = await request.json();
    const shopId = String(body.shop_id ?? '');
    if (!shopId) return NextResponse.json({ ok: false, message: 'shop_id required' }, { status: 400 });
    if (shopId !== auth.shopId) return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
    if (!supabase) return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 503 });
    const { data: shop } = await supabase.from('shops').select('*').eq('id', shopId).maybeSingle();
    if (!shop) return NextResponse.json({ ok: false, message: 'Shop not found' }, { status: 404 });
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('shop_id', shopId);
    if (shop.plan === 'free' && (count ?? 0) >= 10) {
      return NextResponse.json({ ok: false, message: 'Free plan limit reached (10 products)' }, { status: 409 });
    }

    if (!String(body.name ?? '').trim()) {
      return NextResponse.json({ ok: false, message: 'Product name required' }, { status: 400 });
    }

    const { data: product, error } = await supabase.from('products').insert({
      shop_id: shopId,
      name: String(body.name ?? '').trim(),
      name_kv: String(body.name_kv ?? body.name ?? '').toLowerCase(),
      buying_price: Number(body.buying_price ?? 0),
      selling_price: Number(body.selling_price ?? 0),
      quantity: Number(body.quantity ?? 0),
      unit: String(body.unit ?? 'piece'),
      parent_id: body.parent_id ? Number(body.parent_id) : null,
      low_stock_threshold: Number(body.low_stock_threshold ?? 2),
    }).select('*').single();
    if (error || !product) return NextResponse.json({ ok: false, message: error?.message ?? 'Could not add product' }, { status: 500 });
    return NextResponse.json({ ok: true, item: product }, { status: 201 });
  } catch (error) {
    console.error('Product route failed', error);
    return NextResponse.json({ ok: false, error: 'Product request failed' }, { status: 500 });
  }
}
