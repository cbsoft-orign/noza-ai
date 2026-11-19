import { NextResponse } from 'next/server';
import { addProduct, db, getProductsByShop, isFreePlanExceeded } from '@/lib/store';
import { PRODUCT_UNITS, isDiscreteProductUnit, suggestProductUnit } from '@/lib/product-units';
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

    const name = String(body.name ?? '').trim();
    const unit = String(body.unit ?? suggestProductUnit(name));
    const quantity = Number(body.quantity ?? 0);
    const buyingPrice = Number(body.buying_price ?? 0);
    const sellingPrice = Number(body.selling_price ?? 0);
    if (!PRODUCT_UNITS.includes(unit as (typeof PRODUCT_UNITS)[number])) {
      return NextResponse.json({ ok: false, message: 'Select a supported product unit.' }, { status: 400 });
    }
    if (![quantity, buyingPrice, sellingPrice].every(Number.isFinite) || quantity < 0 || buyingPrice < 0 || sellingPrice < 0) {
      return NextResponse.json({ ok: false, message: 'Stock and prices must be valid non-negative numbers.' }, { status: 400 });
    }
    if (isDiscreteProductUnit(unit) && !Number.isInteger(quantity)) {
      return NextResponse.json({ ok: false, message: `${unit} quantities must be whole numbers.` }, { status: 400 });
    }

    const { data: product, error } = await supabase.from('products').insert({
      shop_id: shopId,
      name,
      name_kv: String(body.name_kv ?? name).toLowerCase(),
      buying_price: buyingPrice,
      selling_price: sellingPrice,
      quantity,
      unit,
      parent_id: body.parent_id ? Number(body.parent_id) : null,
      low_stock_threshold: Number(body.low_stock_threshold ?? 2),
    }).select('*').single();
    if (error || !product) return NextResponse.json({ ok: false, message: error?.message ?? 'Could not add product' }, { status: 500 });
    return NextResponse.json({
      ok: true,
      item: {
        ...product,
        buying_price: Number(product.buying_price),
        selling_price: Number(product.selling_price),
        quantity: Number(product.quantity),
        low_stock_threshold: Number(product.low_stock_threshold),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Product route failed', error);
    return NextResponse.json({ ok: false, error: 'Product request failed' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = readShopSession(request);
    if (!auth) return NextResponse.json({ ok: false, message: 'Session expired. Please sign in again.' }, { status: 401 });
    if (!supabase) return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 503 });

    const body = await request.json();
    const productId = String(body.product_id ?? '');
    const quantityToAdd = Number(body.quantity);
    if (!productId || !Number.isFinite(quantityToAdd) || quantityToAdd <= 0) {
      return NextResponse.json({ ok: false, message: 'Enter a stock quantity greater than zero.' }, { status: 400 });
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('shop_id', auth.shopId)
      .maybeSingle();
    if (productError) return NextResponse.json({ ok: false, message: productError.message }, { status: 500 });
    if (!product) return NextResponse.json({ ok: false, message: 'Product not found.' }, { status: 404 });
    if (isDiscreteProductUnit(product.unit) && !Number.isInteger(quantityToAdd)) {
      return NextResponse.json({ ok: false, message: `${product.unit} quantities must be whole numbers.` }, { status: 400 });
    }

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update({ quantity: Number(product.quantity) + quantityToAdd })
      .eq('id', productId)
      .eq('shop_id', auth.shopId)
      .select('*')
      .single();
    if (error || !updatedProduct) {
      return NextResponse.json({ ok: false, message: error?.message ?? 'Could not add stock.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      item: {
        ...updatedProduct,
        buying_price: Number(updatedProduct.buying_price),
        selling_price: Number(updatedProduct.selling_price),
        quantity: Number(updatedProduct.quantity),
        low_stock_threshold: Number(updatedProduct.low_stock_threshold),
      },
    });
  } catch (error) {
    console.error('Stock update failed', error);
    return NextResponse.json({ ok: false, message: 'Stock update failed.' }, { status: 500 });
  }
}
