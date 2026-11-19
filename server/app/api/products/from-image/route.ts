import { NextResponse } from 'next/server';
import { getVillageCatalog } from '@/lib/catalog';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const village = String(payload.village ?? 'Nyabugogo');
    const catalog = getVillageCatalog(village);

    const items = catalog.slice(0, 5).map((item) => ({
      name: item.name,
      estimated_price: item.avg_price,
      confidence: 0.91,
      unit: item.unit,
    }));

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error('Image parse failed', error);
    return NextResponse.json({ ok: false, error: 'Image analysis failed' }, { status: 500 });
  }
}
