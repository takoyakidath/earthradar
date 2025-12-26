import { NextResponse } from 'next/server';
import type { ApiEarthquakeEntry, ValidEarthquakeEntry } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const res = await fetch("https://api-v2-sandbox.p2pquake.net/v2/history?codes=551");
  const data: ApiEarthquakeEntry[] = await res.json();

  const filtered = data
    .map((entry): ValidEarthquakeEntry | null => {
      const lat = entry.earthquake?.hypocenter?.latitude;
      const lon = entry.earthquake?.hypocenter?.longitude;

      if (
        typeof lat !== 'number' || typeof lon !== 'number' ||
        lat < -90 || lat > 90 || lon < -180 || lon > 180
      ) return null;

      const validPoints = (entry.points || []).filter((p) => p.scale > 0);
      if (validPoints.length === 0) return null;

      return {
        ...entry,
        points: validPoints,
      } as ValidEarthquakeEntry;
    })
    .filter((entry): entry is ValidEarthquakeEntry => entry !== null);

  return NextResponse.json(filtered);
}
