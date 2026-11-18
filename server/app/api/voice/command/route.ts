import { NextResponse, type NextRequest } from 'next/server';
import { readShopSession } from '@/lib/shop-session';
import { normalizeProductName } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { detectIntent } from '@/lib/intent';

export async function POST(request: NextRequest) {
  const session = readShopSession(request);
  if (!session) return NextResponse.json({ ok: false, message: 'Session expired. Please sign in again.' }, { status: 401 });
  if (!supabase) return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 503 });

  try {
    const body = await request.json();
    const text = String(body.text ?? '').trim();
    if (!text) return NextResponse.json({ ok: false, message: 'Command text required' }, { status: 400 });

    const detected = detectIntent(text);
    const { data: productRows, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', session.shopId);
    if (productsError) return NextResponse.json({ ok: false, message: productsError.message }, { status: 500 });
    const products = productRows ?? [];

    if (detected.intent === 'STOCK') {
      const response = products.length
        ? products.map((product) => `${product.name}: ${product.quantity} ${product.unit}`).join('\n')
        : 'No products in inventory.';
      return NextResponse.json({ ok: true, intent: detected.intent, transcript: text, response });
    }

    if (detected.intent === 'REPORT') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const { data: saleRows, error } = await supabase
        .from('sales')
        .select('quantity_sold, selling_price_at_time, profit')
        .eq('shop_id', session.shopId)
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString());
      if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
      const sales = saleRows ?? [];
      const revenue = sales.reduce((total, sale) => total + Number(sale.quantity_sold) * Number(sale.selling_price_at_time), 0);
      const profit = sales.reduce((total, sale) => total + Number(sale.profit), 0);
      return NextResponse.json({
        ok: true,
        intent: detected.intent,
        transcript: text,
        response: `Today's sales: ${revenue.toLocaleString()} RWF; profit: ${profit.toLocaleString()} RWF.`,
      });
    }

    const quantityMatch = /(\d+(?:\.\d+)?)\s*(?:kg|piece|pieces|loaf|loaves|slice|slices|cup|cups)?\s*$/i.exec(text);
    if (!quantityMatch) {
      return NextResponse.json({ ok: false, message: 'Please say a product name and quantity.' }, { status: 422 });
    }
    const quantity = Number(quantityMatch[1]);
    const commandName = text.slice(0, quantityMatch.index).replace(/^(gurisha|sell|sold|mfite|ongeraho|add|shyiraho)\s+/i, '').trim();
    const normalizedName = normalizeProductName(commandName);
    const product = products.find((item) => {
      const candidate = normalizeProductName(item.name);
      return candidate === normalizedName || candidate.includes(normalizedName) || normalizedName.includes(candidate);
    });

    if (detected.intent === 'SELL') {
      if (!product) return NextResponse.json({ ok: false, message: `Product not found: ${commandName}` }, { status: 404 });
      if (quantity > Number(product.quantity)) return NextResponse.json({ ok: false, message: 'Insufficient stock.' }, { status: 409 });
      const profit = quantity * (Number(product.selling_price) - Number(product.buying_price));
      const { error: stockError } = await supabase
        .from('products')
        .update({ quantity: Number(product.quantity) - quantity })
        .eq('id', product.id)
        .eq('shop_id', session.shopId);
      if (stockError) return NextResponse.json({ ok: false, message: stockError.message }, { status: 500 });
      const { error: saleError } = await supabase.from('sales').insert({
        shop_id: session.shopId,
        product_id: product.id,
        quantity_sold: quantity,
        selling_price_at_time: product.selling_price,
        buying_price_at_time: product.buying_price,
        profit,
        sold_by: 'owner',
      });
      if (saleError) return NextResponse.json({ ok: false, message: saleError.message }, { status: 500 });
      return NextResponse.json({
        ok: true,
        intent: detected.intent,
        transcript: text,
        response: `Sold ${quantity} ${product.unit} of ${product.name}. Profit: ${profit.toLocaleString()} RWF.`,
      });
    }

    if (detected.intent === 'ADD') {
      if (product) {
        const { error } = await supabase
          .from('products')
          .update({ quantity: Number(product.quantity) + quantity })
          .eq('id', product.id)
          .eq('shop_id', session.shopId);
        if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
        return NextResponse.json({
          ok: true,
          intent: detected.intent,
          transcript: text,
          response: `Added ${quantity} ${product.unit} to ${product.name}.`,
        });
      }

      const { data: shop } = await supabase.from('shops').select('plan').eq('id', session.shopId).maybeSingle();
      if (shop?.plan === 'free' && products.length >= 10) {
        return NextResponse.json({ ok: false, message: 'Free plan limit reached (10 products).' }, { status: 409 });
      }
      const { error } = await supabase.from('products').insert({
        shop_id: session.shopId,
        name: commandName,
        name_kv: normalizedName,
        quantity,
        unit: 'piece',
        buying_price: 0,
        selling_price: 0,
        low_stock_threshold: 2,
      });
      if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
      return NextResponse.json({
        ok: true,
        intent: detected.intent,
        transcript: text,
        response: `Added ${commandName} to inventory.`,
      });
    }

    return NextResponse.json({
      ok: false,
      message: 'Command not recognized. Try STOCK, Gurisha umuceri 2, or Mfite isukari 5.',
    }, { status: 422 });
  } catch (error) {
    console.error('Voice command failed', error);
    return NextResponse.json({ ok: false, message: 'Voice command failed.' }, { status: 500 });
  }
}
