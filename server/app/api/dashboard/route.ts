import { NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function GET() {
  const totalSales = db.sales.reduce((sum, sale) => sum + sale.quantity_sold * sale.selling_price_at_time, 0);
  const totalProfit = db.sales.reduce((sum, sale) => sum + sale.profit, 0);

  return NextResponse.json({
    ok: true,
    summary: {
      shops: db.shops.length,
      products: db.products.length,
      sales: db.sales.length,
      totalSales,
      totalProfit,
    },
  });
}
