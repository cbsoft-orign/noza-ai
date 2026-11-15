import { NextResponse } from 'next/server';
import { createPayment, getShopByPhone } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = String(body.phone ?? '');
    const type = String(body.type ?? '200_daily');
    const amount = Number(body.amount ?? 200);
    const momoRef = String(body.momo_ref ?? `MOMO-${Date.now()}`);

    const shop = getShopByPhone(phone) ?? getShopByPhone(`250${phone.replace(/^0+/, '')}`);
    if (!shop) {
      return NextResponse.json({ ok: false, message: 'Shop not found' }, { status: 404 });
    }

    const payment = createPayment(shop.id, amount, type === '5000_monthly' ? '5000_monthly' : '200_daily', momoRef);
    return NextResponse.json({ ok: true, payment, plan: shop.plan });
  } catch (error) {
    console.error('Payment route failed', error);
    return NextResponse.json({ ok: false, error: 'Payment failed' }, { status: 500 });
  }
}
