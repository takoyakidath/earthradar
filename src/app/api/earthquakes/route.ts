import { NextResponse } from "next/server";
import { fetchHistory, P2PQuakeFetchError } from "@/lib/p2pquake/rest";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const messages = await fetchHistory();
    return NextResponse.json(messages, {
      headers: {
        "Cache-Control": "public, max-age=3, stale-while-revalidate=10",
      },
    });
  } catch (error) {
    const cause = error instanceof P2PQuakeFetchError ? error.cause : undefined;
    console.error("[api/earthquakes] upstream fetch failed", error, cause);
    return NextResponse.json(
      { error: "地震情報の取得に失敗しました。しばらくしてから再度お試しください。" },
      { status: 502 }
    );
  }
}
