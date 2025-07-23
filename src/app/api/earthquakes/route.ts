import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  const res = await fetch('https://api-v2-sandbox.p2pquake.net/v2/history?codes=551');
  const data = await res.json();

  const filtered = data
    .map((entry: any) => {
      // 震源地の緯度・経度が異常なら除外対象とする
      const lat = entry.earthquake?.hypocenter?.latitude;
      const lon = entry.earthquake?.hypocenter?.longitude;
      if (
        typeof lat !== 'number' || typeof lon !== 'number' ||
        lat < -90 || lat > 90 || lon < -180 || lon > 180
      ) return null;

      // 有効な観測点のみを残す
      const validPoints = (entry.points || []).filter((p: any) => p.scale > 0);
      if (validPoints.length === 0) return null;

      return {
        ...entry,
        points: validPoints,
      };
    })
    .filter((entry: null) => entry !== null);

  return NextResponse.json(filtered);
}
