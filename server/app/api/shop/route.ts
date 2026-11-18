import { NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { readShopSession, createShopSession, shopSessionCookie } from '@/lib/shop-session';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const auth = readShopSession(request);
  if (!auth) return NextResponse.json({ ok: false, message: 'Session expired. Please sign in again.' }, { status: 401 });
  const url = new URL(request.url);
  const phone = normalizePhone(url.searchParams.get('phone') ?? '');
  if (!phone) return NextResponse.json({ ok: false, message: 'Phone required' }, { status: 400 });
  if (!supabase) return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 503 });

  const { data: shop, error: shopError } = await supabase.from('shops').select('*').eq('phone', phone).maybeSingle();
  if (shopError) return NextResponse.json({ ok: false, message: shopError.message }, { status: 500 });
  if (!shop) return NextResponse.json({ ok: false, message: 'Shop not found' }, { status: 404 });
  if (shop.id !== auth.shopId || shop.phone !== auth.phone) {
    return NextResponse.json({ ok: false, message: 'Session does not belong to this shop.' }, { status: 403 });
  }

  const [{ data: products = [] }, { data: sales = [] }] = await Promise.all([
    supabase.from('products').select('*').eq('shop_id', shop.id).order('name'),
    supabase.from('sales').select('*, products(name)').eq('shop_id', shop.id).order('created_at', { ascending: false }),
  ]);
  const mappedSales = (sales as any[]).map((sale) => ({
    ...sale,
    quantity_sold: Number(sale.quantity_sold),
    selling_price_at_time: Number(sale.selling_price_at_time),
    profit: Number(sale.profit),
    product_name: sale.products?.name ?? 'Product',
  }));
  const mappedProducts = (products as any[]).map((product) => ({
    ...product,
    buying_price: Number(product.buying_price),
    selling_price: Number(product.selling_price),
    quantity: Number(product.quantity),
    low_stock_threshold: Number(product.low_stock_threshold),
  }));
  const { data: user } = await supabase.from('users').select('*').eq('shop_id', shop.id).eq('phone', phone).maybeSingle();

  return NextResponse.json({ ok: true, shop, user: user ?? null, products: mappedProducts, sales: mappedSales });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(String(body.phone ?? ''));
    if (!phone) return NextResponse.json({ ok: false, message: 'Phone required' }, { status: 400 });

    if (!supabase) return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 503 });
    const { data: existing } = await supabase.from('shops').select('*').eq('phone', phone).maybeSingle();
    if (existing) {
      const response = NextResponse.json({
        ok: true,
        shop: existing,
        user: { id: 'user-1', name: String(body.ownerName ?? 'Shop Owner'), role: 'owner', phone },
      });
      response.cookies.set(shopSessionCookie(createShopSession(existing.id, existing.phone)));
      return response;
    }

    const { data: shop, error } = await supabase.from('shops').insert({
      phone,
      name: String(body.name ?? 'New Shop'),
      village: String(body.village ?? 'Nyabugogo'),
      plan: 'free',
      credits: 20,
    }).select('*').single();
    if (error || !shop) return NextResponse.json({ ok: false, message: error?.message ?? 'Could not create shop' }, { status: 500 });

    const { data: user } = await supabase.from('users').insert({
      shop_id: shop.id,
      phone,
      role: 'owner',
      name: String(body.ownerName ?? 'Shop Owner'),
    }).select('*').single();

    const response = NextResponse.json({
      ok: true,
      shop,
      user: user ?? { id: '', shop_id: shop.id, phone, role: 'owner', name: String(body.ownerName ?? 'Shop Owner') },
      status: 'created',
    }, { status: 201 });
    response.cookies.set(shopSessionCookie(createShopSession(shop.id, shop.phone)));
    return response;
  } catch (error) {
    console.error('Shop route failed', error);
    return NextResponse.json({ ok: false, error: 'Shop request failed' }, { status: 500 });
  }
}
