import { NextResponse } from 'next/server';
import { createPayment, getShopByPhone } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { readShopSession } from '@/lib/shop-session';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const auth = readShopSession(request);
    if (!auth) return NextResponse.json({ ok: false, message: 'Session expired. Please sign in again.' }, { status: 401 });
    const body = await request.json();
    const phone = String(body.phone ?? '');
    const type = String(body.type ?? '200_daily');
    const amount = Number(body.amount ?? 200);
    const momoRef = String(body.momo_ref ?? `MOMO-${Date.now()}`);

    if (!supabase) return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 503 });
    const { data: shop } = await supabase.from('shops').select('*').eq('phone', phone).maybeSingle();
    if (!shop) {
      return NextResponse.json({ ok: false, message: 'Shop not found' }, { status: 404 });
    }
    if (shop.id !== auth.shopId || shop.phone !== auth.phone) {
      return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
    }
    const paymentType = type === '5000_monthly' ? '5000_monthly' : '200_daily';
    const { data: payment, error } = await supabase.from('payments').insert({
      shop_id: shop.id,
      amount,
      type: paymentType,
      status: 'paid',
      momo_ref: momoRef,
    }).select('*').single();
    if (error || !payment) return NextResponse.json({ ok: false, message: error?.message ?? 'Payment failed' }, { status: 500 });
    const plan = paymentType === '5000_monthly' ? 'monthly' : 'daily';
    const credits = plan === 'monthly' ? 200 : 25;
    await supabase.from('shops').update({ plan, credits }).eq('id', shop.id);
    return NextResponse.json({ ok: true, payment, plan });
  } catch (error) {
    console.error('Payment route failed', error);
    return NextResponse.json({ ok: false, error: 'Payment failed' }, { status: 500 });
  }
}
