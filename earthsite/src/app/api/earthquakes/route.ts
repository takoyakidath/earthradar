import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  const res = await fetch('https://api-v2-sandbox.p2pquake.net/v2/history?codes=551'); 
  const data = await res.json();
  return NextResponse.json(data);
}