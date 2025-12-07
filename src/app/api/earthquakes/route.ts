import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

interface Hypocenter {
  latitude: number;
  longitude: number;
  depth: number;
  magnitude: number;
  name: string;
}

interface Earthquake {
  time: string;
  hypocenter?: Hypocenter;
  maxScale: number;
}

interface Point {
  addr: string;
  scale: number;
  isArea: boolean;
}

interface RawEntry {
  id: string;
  earthquake?: Earthquake;
  points?: Point[];
  [key: string]: unknown; // 他にもあるが使わないフィールドのため
}

interface ValidEntry extends RawEntry {
  points: Point[];
  earthquake: Earthquake;
}

export async function GET() {
  const res = await fetch("https://api-v2-sandbox.p2pquake.net/v2/history?codes=551");
  const data: RawEntry[] = await res.json();

  const filtered = data
    .map((entry): ValidEntry | null => {
      const lat = entry.earthquake?.hypocenter?.latitude;
      const lon = entry.earthquake?.hypocenter?.longitude;

      if (
        typeof lat !== 'number' || typeof lon !== 'number' ||
        lat < -90 || lat > 90 || lon < -180 || lon > 180
      ) return null;

      const validPoints = (entry.points || []).filter((p): p is Point => p.scale > 0);
      if (validPoints.length === 0) return null;

      return {
        ...entry,
        points: validPoints,
      } as ValidEntry;
    })
    .filter((entry): entry is ValidEntry => entry !== null);

  return NextResponse.json(filtered);
}
