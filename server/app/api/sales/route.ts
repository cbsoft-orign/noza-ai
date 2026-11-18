import { NextResponse } from 'next/server';
import { addSaleEntry, db, getProductById, updateProductQuantity } from '@/lib/store';
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
  const { data, error } = await supabase.from('sales').select('*, products(name)').eq('shop_id', shopId).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  const sales = (data ?? []).map((sale: any) => ({ ...sale, product_name: sale.products?.name ?? 'Product' }));
  return NextResponse.json({ ok: true, items: sales });
}

export async function POST(request: NextRequest) {
  try {
    const auth = readShopSession(request);
    if (!auth) return NextResponse.json({ ok: false, message: 'Session expired. Please sign in again.' }, { status: 401 });
    const body = await request.json();
    const shopId = String(body.shop_id ?? '');
    if (shopId !== auth.shopId) return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
    const productId = String(body.product_id ?? '');
    const quantity = Number(body.quantity);
    if (!shopId || !productId || !Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ ok: false, message: 'Invalid sale' }, { status: 400 });
    }

    if (!supabase) return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 503 });
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .eq('id', String(body.product_id))
      .maybeSingle();
    if (productError) return NextResponse.json({ ok: false, message: productError.message }, { status: 500 });
    if (!product) return NextResponse.json({ ok: false, message: 'Product not found' }, { status: 404 });
    if (quantity > Number(product.quantity)) {
      return NextResponse.json({ ok: false, message: 'Insufficient stock' }, { status: 409 });
    }

    const profit = quantity * (Number(product.selling_price) - Number(product.buying_price));
    const newQuantity = Number(product.quantity) - quantity;
    const { error: stockError } = await supabase.from('products').update({ quantity: newQuantity }).eq('id', product.id);
    if (stockError) return NextResponse.json({ ok: false, message: stockError.message }, { status: 500 });
    const { data: sale, error: saleError } = await supabase.from('sales').insert({
      shop_id: shopId,
      product_id: productId,
      quantity_sold: quantity,
      selling_price_at_time: product.selling_price,
      buying_price_at_time: product.buying_price,
      profit,
      sold_by: body.sold_by === 'worker' ? 'worker' : 'owner',
    }).select('*').single();
    if (saleError || !sale) return NextResponse.json({ ok: false, message: saleError?.message ?? 'Could not record sale' }, { status: 500 });

    return NextResponse.json({
      ok: true,
      item: { ...sale, product_name: product.name },
      product: { ...product, quantity: newQuantity },
    }, { status: 201 });
  } catch (error) {
    console.error('Sale route failed', error);
    return NextResponse.json({ ok: false, error: 'Sale request failed' }, { status: 500 });
  }
}
