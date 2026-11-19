import { NextResponse, type NextRequest } from 'next/server';
import { readShopSession } from '@/lib/shop-session';
import { normalizeProductName } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { parseShopCommand } from '@/lib/shop-commands';
import { formatUnitAmount, formatUnitLabel, isDiscreteProductUnit, PRODUCT_UNITS } from '@/lib/product-units';

type ProductRow = {
  id: string;
  name: string;
  name_kv?: string | null;
  unit: string;
  quantity: number | string;
  buying_price: number | string;
  selling_price: number | string;
};

type ProductMatch = { product?: ProductRow; ambiguous?: ProductRow[] };

function findProduct(products: ProductRow[], requestedName: string): ProductMatch {
  const query = normalizeProductName(requestedName);
  const exact = products.filter((product) => (
    normalizeProductName(product.name) === query
    || normalizeProductName(product.name_kv ?? '') === query
  ));
  if (exact.length === 1) return { product: exact[0] };
  if (exact.length > 1) return { ambiguous: exact };

  const similar = products.filter((product) => {
    const name = normalizeProductName(product.name);
    return query.length > 1 && (name.includes(query) || query.includes(name));
  });
  if (similar.length === 1) return { product: similar[0] };
  if (similar.length > 1) return { ambiguous: similar };
  return {};
}

function ambiguousProductMessage(products: ProductRow[]) {
  return `Izina rihura n’ibicuruzwa birenze kimwe: ${products.map((product) => product.name).join(', ')}. Vuga izina ryuzuye.`;
}

function notFoundMessage(productName: string) {
  return `Ntabwo mbona “${productName}” mu bubiko. Reba izina ry’igicuruzwa, cyangwa ubanze ukore igicuruzwa gishya.`;
}

export async function POST(request: NextRequest) {
  const session = readShopSession(request);
  if (!session) return NextResponse.json({ ok: false, message: 'Session expired. Please sign in again.' }, { status: 401 });
  if (!supabase) return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 503 });

  try {
    const body = await request.json();
    const text = String(body.text ?? '').trim();
    if (!text) return NextResponse.json({ ok: false, message: 'Command text required' }, { status: 400 });
    if (body.mode !== undefined && body.mode !== 'sell') {
      return NextResponse.json({ ok: false, message: 'Unsupported voice command mode.' }, { status: 400 });
    }

    const command = parseShopCommand(text, body.mode === 'sell');
    if (command.kind === 'INCOMPLETE') {
      return NextResponse.json({ ok: false, message: command.message, intent: 'INCOMPLETE' }, { status: 422 });
    }

    const { data: productRows, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', session.shopId);
    if (productsError) return NextResponse.json({ ok: false, message: productsError.message }, { status: 500 });
    const products = (productRows ?? []) as ProductRow[];

    if (command.kind === 'STOCK') {
      const response = products.length
        ? products.map((product) => `${product.name}: ${formatUnitAmount(Number(product.quantity), product.unit)}`).join('\n')
        : 'Nta bicuruzwa biri mu bubiko.';
      return NextResponse.json({ ok: true, intent: command.kind, transcript: text, response });
    }

    if (command.kind === 'REPORT') {
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
        intent: command.kind,
        transcript: text,
        response: `Uyu munsi wagurishije ${revenue.toLocaleString()} RWF; inyungu ni ${profit.toLocaleString()} RWF.`,
      });
    }

    if (command.kind === 'CREATE_PRODUCT') {
      if (!PRODUCT_UNITS.includes(command.unit)) {
        return NextResponse.json({ ok: false, message: 'Iki gipimo ntigishyigikiwe. Hitamo kg, piece, l, pack cyangwa ikindi gipimo kiri kuri uru rutonde.' }, { status: 400 });
      }
      if (![command.quantity, command.buyingPrice, command.sellingPrice].every(Number.isFinite)
        || command.quantity < 0 || command.buyingPrice < 0 || command.sellingPrice <= 0) {
        return NextResponse.json({ ok: false, message: 'Umubare w’ibicuruzwa n’ibiciro bigomba kuba imibare yemewe; igiciro cyo kugurisha kigomba kurenga zero.' }, { status: 400 });
      }
      if (isDiscreteProductUnit(command.unit) && !Number.isInteger(command.quantity)) {
        return NextResponse.json({ ok: false, message: `Umubare w’ibicuruzwa bipimwa muri ${formatUnitLabel(command.unit)} ugomba kuba umubare wuzuye.` }, { status: 400 });
      }

      const match = findProduct(products, command.name);
      if (match.product) {
        return NextResponse.json({
          ok: false,
          message: `“${match.product.name}” isanzwe iri mu bubiko. Koresha “Ongeraho ${match.product.name} ${formatUnitLabel(match.product.unit)} 5” kugira ngo wongere stock.`,
        }, { status: 409 });
      }
      if (match.ambiguous) {
        return NextResponse.json({ ok: false, message: ambiguousProductMessage(match.ambiguous) }, { status: 409 });
      }

      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('plan')
        .eq('id', session.shopId)
        .maybeSingle();
      if (shopError) return NextResponse.json({ ok: false, message: shopError.message }, { status: 500 });
      if (!shop) return NextResponse.json({ ok: false, message: 'Ntabwo mbona iduka rifitanye isano n’iyi konti.' }, { status: 404 });

      if (shop.plan === 'free') {
        const { count, error: countError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', session.shopId);
        if (countError) return NextResponse.json({ ok: false, message: countError.message }, { status: 500 });
        if ((count ?? 0) >= 10) {
          return NextResponse.json({ ok: false, message: 'Iduka rigeze ku bicuruzwa 10 bya Free Plan. Hindura gahunda kugira ngo wongere ibindi.' }, { status: 409 });
        }
      }

      const { data: product, error } = await supabase.from('products').insert({
        shop_id: session.shopId,
        name: command.name,
        name_kv: normalizeProductName(command.name),
        unit: command.unit,
        quantity: command.quantity,
        buying_price: command.buyingPrice,
        selling_price: command.sellingPrice,
        low_stock_threshold: 2,
      }).select('*').single();
      if (error || !product) {
        console.error('Voice product creation failed', error);
        return NextResponse.json({ ok: false, message: error?.message ?? 'Ntibyashobotse gukora igicuruzwa.' }, { status: 500 });
      }
      return NextResponse.json({
        ok: true,
        intent: command.kind,
        transcript: text,
        response: `Igicuruzwa ${product.name} cyongewe mu bubiko: ${formatUnitAmount(Number(product.quantity), product.unit)}. Kugura: ${Number(product.buying_price).toLocaleString()} RWF; kugurisha: ${Number(product.selling_price).toLocaleString()} RWF kuri ${formatUnitLabel(product.unit)}.`,
      }, { status: 201 });
    }

    if (command.kind === 'UPDATE_PRICES') {
      const match = findProduct(products, command.productName);
      if (match.ambiguous) {
        return NextResponse.json({ ok: false, message: ambiguousProductMessage(match.ambiguous) }, { status: 409 });
      }
      const product = match.product;
      if (!product) return NextResponse.json({ ok: false, message: notFoundMessage(command.productName) }, { status: 404 });
      if ((command.buyingPrice !== undefined && (!Number.isFinite(command.buyingPrice) || command.buyingPrice < 0))
        || (command.sellingPrice !== undefined && (!Number.isFinite(command.sellingPrice) || command.sellingPrice <= 0))) {
        return NextResponse.json({ ok: false, message: 'Ibiciro bishya bigomba kuba imibare yemewe; igiciro cyo kugurisha kigomba kurenga zero.' }, { status: 400 });
      }

      const updates: { buying_price?: number; selling_price?: number } = {};
      if (command.buyingPrice !== undefined) updates.buying_price = command.buyingPrice;
      if (command.sellingPrice !== undefined) updates.selling_price = command.sellingPrice;
      const { error } = await supabase.from('products')
        .update(updates)
        .eq('id', product.id)
        .eq('shop_id', session.shopId);
      if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

      const changes = [
        command.buyingPrice !== undefined
          ? `igiciro cyo kugura ${Number(product.buying_price).toLocaleString()} → ${command.buyingPrice.toLocaleString()} RWF`
          : null,
        command.sellingPrice !== undefined
          ? `igiciro cyo kugurisha ${Number(product.selling_price).toLocaleString()} → ${command.sellingPrice.toLocaleString()} RWF`
          : null,
      ].filter(Boolean);
      return NextResponse.json({
        ok: true,
        intent: command.kind,
        transcript: text,
        response: `${product.name}: ${changes.join('; ')} kuri ${formatUnitLabel(product.unit)}.`,
      });
    }

    if (command.kind === 'SELL' || command.kind === 'ADD_STOCK') {
      const match = findProduct(products, command.productName);
      if (match.ambiguous) {
        return NextResponse.json({ ok: false, message: ambiguousProductMessage(match.ambiguous) }, { status: 409 });
      }
      const product = match.product;
      if (!product) return NextResponse.json({ ok: false, message: notFoundMessage(command.productName) }, { status: 404 });
      if (command.unit && command.unit !== product.unit) {
        return NextResponse.json({
          ok: false,
          message: `${product.name} ipimwa muri ${formatUnitLabel(product.unit)}, si muri ${formatUnitLabel(command.unit)}.`,
        }, { status: 422 });
      }
      if (!Number.isFinite(command.quantity) || command.quantity <= 0) {
        return NextResponse.json({ ok: false, message: 'Vuga umubare urenze zero.' }, { status: 400 });
      }
      if (isDiscreteProductUnit(product.unit) && !Number.isInteger(command.quantity)) {
        return NextResponse.json({ ok: false, message: `Umubare wa ${formatUnitLabel(product.unit)} ugomba kuba umubare wuzuye.` }, { status: 400 });
      }

      if (command.kind === 'SELL') {
        if (command.quantity > Number(product.quantity)) {
          return NextResponse.json({ ok: false, message: `Stock ntihagije. Hasigaye ${formatUnitAmount(Number(product.quantity), product.unit)}.` }, { status: 409 });
        }
        const profit = command.quantity * (Number(product.selling_price) - Number(product.buying_price));
        const { error: stockError } = await supabase.from('products')
          .update({ quantity: Number(product.quantity) - command.quantity })
          .eq('id', product.id)
          .eq('shop_id', session.shopId);
        if (stockError) return NextResponse.json({ ok: false, message: stockError.message }, { status: 500 });
        const { error: saleError } = await supabase.from('sales').insert({
          shop_id: session.shopId,
          product_id: product.id,
          quantity_sold: command.quantity,
          selling_price_at_time: product.selling_price,
          buying_price_at_time: product.buying_price,
          profit,
          sold_by: 'owner',
        });
        if (saleError) return NextResponse.json({ ok: false, message: saleError.message }, { status: 500 });
        return NextResponse.json({
          ok: true,
          intent: command.kind,
          transcript: text,
          response: `Byagurishijwe: ${formatUnitAmount(command.quantity, product.unit)} bya ${product.name}. Asigaye: ${formatUnitAmount(Number(product.quantity) - command.quantity, product.unit)}. Inyungu: ${profit.toLocaleString()} RWF.`,
        });
      }

      const updatedQuantity = Number(product.quantity) + command.quantity;
      const { error } = await supabase.from('products')
        .update({ quantity: updatedQuantity })
        .eq('id', product.id)
        .eq('shop_id', session.shopId);
      if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
      return NextResponse.json({
        ok: true,
        intent: command.kind,
        transcript: text,
        response: `Wongeyeho ${formatUnitAmount(command.quantity, product.unit)} bya ${product.name}. Hasigaye ${formatUnitAmount(updatedQuantity, product.unit)}.`,
      });
    }

    return NextResponse.json({
      ok: false,
      message: 'Sinumvise itegeko. Gerageza: “Gurisha umuceri ibiro 2”; “Ongeraho isukari 5”; “Kora igicuruzwa gishya ibirayi, kg, stock 10, kugura 500, kugurisha 700”; cyangwa “Hindura igiciro cyo kugurisha ibirayi 800”.',
    }, { status: 422 });
  } catch (error) {
    console.error('Voice command failed', error);
    return NextResponse.json({ ok: false, message: 'Voice command failed.' }, { status: 500 });
  }
}
