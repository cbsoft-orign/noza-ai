import { NextResponse } from 'next/server';
import { createDailyReport, db } from '@/lib/store';
import { sendWhatsAppText } from '@/lib/whatsapp';

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const reports: Array<{ shopId: string; report: any }> = [];

  for (const shop of db.shops) {
    const report = createDailyReport(shop.id, today);
    const totalProfit = report.total_profit;
    const message = `Muraho ${shop.name} Uyu munsi: Wagurishije ${report.total_sales.toLocaleString()} RWF Inyungu: ${report.total_profit.toLocaleString()} RWF Stock isigaye: ${report.stock_value.toLocaleString()} RWF`;
    await sendWhatsAppText(shop.phone, message);
    reports.push({ shopId: shop.id, report });

    if (totalProfit > 0) {
      const day7Profit = db.sales
        .filter((sale) => sale.shop_id === shop.id)
        .slice(-7)
        .reduce((sum, item) => sum + item.profit, 0);
      const day7Message = `Muri iyi minsi 7, Wungutse ${day7Profit.toLocaleString()} RWF - Komeza kuri 200 RWF gusa. Andika ISHYURA 200`;
      await sendWhatsAppText(shop.phone, day7Message);
    }
  }

  return NextResponse.json({ ok: true, date: today, reports });
}
