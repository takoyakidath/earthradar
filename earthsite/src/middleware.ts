// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
// ホワイトリストに登録されたIPリストを取得します。
const ipWhiteList = new Set(
  process.env.IP_WHITE_LIST?.split("").map((item: string) => {
    return item.trim();
  })
);

// アクセス制限対象のFQDNを取得します。
const accessRestrictionFqdnList = new Set(
  process.env.ACCESS_RESTRICTION_FQDN_LIST?.split("").map((item: string) => {
    return item.trim();
  })
);

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    if (
      !ipWhiteList.has(request.ip as string) &&
      accessRestrictionFqdnList.has(request.nextUrl.host)
    ) {
      console.info(
        `ホワイトリストに追加されていないIPアドレスからアクセスされたため、アクセスを拒否しました。[request.ip = ${request.ip}, request.nextUrl.host = ${request.nextUrl.host}]`
      );
      return new NextResponse(null, { status: 401 });
    } else {
      console.info(
        `ホワイトリストに追加されているIPアドレスからアクセスされました。[request.ip = ${request.ip}, request.nextUrl.host = ${request.nextUrl.host}]`
      );
    }
  }
}