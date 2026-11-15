import { NextResponse } from 'next/server';
import { getVillageCatalog } from '@/lib/catalog';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const village = url.searchParams.get('village') ?? 'Nyabugogo';
  const items = getVillageCatalog(village);
  return NextResponse.json({ ok: true, village, items });
}
