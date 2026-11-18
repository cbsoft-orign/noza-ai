import { NextResponse } from 'next/server';
import { db } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { readShopSession } from '@/lib/shop-session';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const auth = readShopSession(request);
  if (!auth) return NextResponse.json({ ok: false, message: 'Session expired. Please sign in again.' }, { status: 401 });
  if (!supabase) return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 503 });
  const [{ data: sales = [] }, { data: products = [] }, { data: shops = [] }] = await Promise.all([
    supabase.from('sales').select('*, products(name)').eq('shop_id', auth.shopId).order('created_at', { ascending: false }),
    supabase.from('products').select('*').eq('shop_id', auth.shopId),
    supabase.from('shops').select('*').eq('id', auth.shopId),
  ]);
  const mappedSales = (sales as any[]).map((sale) => ({
    ...sale,
    quantity_sold: Number(sale.quantity_sold),
    selling_price_at_time: Number(sale.selling_price_at_time),
    profit: Number(sale.profit),
    product_name: sale.products?.name ?? 'Product',
  }));
  const totalSales = mappedSales.reduce((sum, sale) => sum + sale.quantity_sold * sale.selling_price_at_time, 0);
  const totalProfit = mappedSales.reduce((sum, sale) => sum + sale.profit, 0);

  return NextResponse.json({
    ok: true,
    summary: {
      shops: shops?.length ?? 0,
      products: products?.length ?? 0,
      sales: mappedSales.length,
      totalSales,
      totalProfit,
    },
    products: products ?? [],
    sales: mappedSales,
    shops: shops ?? [],
  });
}
