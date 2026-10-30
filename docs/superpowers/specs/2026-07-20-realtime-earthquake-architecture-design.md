# earthradar: リアルタイム化 + 全面リファクタリング設計

## 背景 / 目的

現状の earthradar は P2P地震情報 API (`https://api.p2pquake.net/v2/history`) を Next.js の API Route 経由で
Sidebar が 30 秒間隔、Map が 10 秒間隔でそれぞれ独立にポーリングしている。この構成には次の問題がある。

1. **遅延**: 自前サーバ経由のポーリングは (a) ポーリング間隔分の待ち、(b) `/history` 自体が WebSocket 配信より
   約 0.5 秒遅い、(c) `code=551`(気象庁確定地震情報)しか取得しておらず、緊急地震速報(EEW, code=556/554)を
   使っていない、という 3 重の遅延要因を抱えている。ユーザー報告の「1〜2分の遅延」の主因は (c) で、
   JMA の確定処理自体に時間がかかるため、確定情報だけを見る限り原理的に埋められない。
2. **二重通信**: Sidebar と Map が別々に `/api/earthquakes` を叩いており、同じデータを 2 系統で取得している。
3. **スケーラビリティ**: 自前 API が P2PQuake 側のレート制限 (`/history`: 60 req/min/IP) を意識しておらず、
   アクセスが増えると自サーバの IP からのリクエストが 429 を受け、全訪問者に影響する。

## 採用アーキテクチャ: ブラウザ直結 WebSocket + EEW 統合 + REST フォールバック

P2PQuake は `wss://api.p2pquake.net/v2/ws` で低遅延のリアルタイム配信を提供している(認証不要、CORS 制約なし)。
WebSocket はブラウザから直接張れるため、**自前サーバーを中継させない**のが最速かつ最も低コストな構成である
(中継を挟むアーキテクチャは原理的に直結より遅くなる上、Vercel のようなサーバーレス環境では長時間接続を
維持する自前リレーサーバーが別途必要になり、インフラコストと複雑さが増す)。

```
ブラウザ ──直結 WebSocket──> wss://api.p2pquake.net/v2/ws
   │         (code 551/552/554/556 を購読、処理遅延 70ms〜0.5秒)
   │
   └──REST(初回描画 + WS切断時フォールバック)──> /api/earthquakes (自前 API)
                                                     └─ P2PQuake /history
                                                        (タイムアウト・リトライ・低TTLキャッシュ)
```

### なぜこの構成か(比較した代替案)

| 案 | 概要 | 却下理由 |
|---|---|---|
| **採用: 直結WS** | ブラウザが P2PQuake WS に直接接続 | — |
| 自前 WS→SSE 中継 | 自前サーバーが P2PQuake に 1 本 WS を張り、全訪問者に SSE で再配信 | 中継が挟まる分、直結より確実に遅い。Vercel の Serverless Function は長時間接続を維持できず、常時起動サーバー(別ホスティング)が追加で必要になり運用コストと障害点が増える。訪問者数が少ない現状ではメリット(上流接続本数の集約)よりデメリットが大きい |
| REST 短間隔ポーリングのみ | WS を使わず `/api/earthquakes` を 1〜2 秒間隔で叩く | `/history` のレート制限(60 req/min/IP)にすぐ抵触する。EEW(554/556)は `/history` でも取得できるが依然としてポーリング間隔分の遅延が残る |

### EEW (緊急地震速報) 利用に関する注意

P2PQuake の公式仕様書には以下の免責が明記されている。

> 内容や配信品質は無保証です。緊急地震速報（警報）としての利活用は非推奨です。
> サーバや受信プログラムは冗長化しておらず、障害時は配信できず、復旧時の再配信もありません。

したがって EEW バナーには **「速報値・未確定」であることを明示し、気象庁公式の緊急地震速報の代替ではない**
旨を注記する。確定情報 (code 551, 同一 `eventId` 相当) が届いた時点でバナーは确定カードに差し替える。

## データモデル

`src/types/index.ts` を全面置換し、P2PQuake の実スキーマに忠実な discriminated union にする。

```ts
export type P2PQuakeMessage = JMAQuakeMessage | JMATsunamiMessage | EewDetectionMessage | EewMessage;

interface BasicData {
  id: string;
  time: string;
}

export interface JMAQuakeMessage extends BasicData {
  code: 551;
  earthquake: { time: string; hypocenter?: Hypocenter; maxScale: number; domesticTsunami?: DomesticTsunami };
  points: QuakePoint[];
}

export interface EewMessage extends BasicData {
  code: 556;
  cancelled: boolean;
  earthquake?: { originTime: string; arrivalTime: string; hypocenter?: EewHypocenter };
  issue: { time: string; eventId: string; serial: string };
  areas: EewArea[];
}
// JMATsunamiMessage (552) / EewDetectionMessage (554) も同様に定義
```

`code` を判別キーにすることで、`switch (msg.code)` だけで型が絞り込まれ、`as` キャストが不要になる。
現行の `ApiEarthquakeEntry`(`[key: string]: unknown` を持つ)、`ValidEarthquakeEntry`、`MapEarthquake` の
3 つの重複型は廃止し、View 用の形は `Pick`/`Omit` などのユーティリティ型で導出する。

## モジュール構成

```
src/
  lib/p2pquake/
    types.ts        既存 types を置換する discriminated union
    guards.ts        型ガード (isJMAQuake, hasValidHypocenter 等)
    rest.ts           /history 呼び出し (timeout + retry + AbortController)
    socket.ts         WebSocket 接続管理 (再接続 + backoff、フレームパース)
  hooks/
    useEarthquakeFeed.ts   直結WS + RESTフォールバックを統合し、接続状態を返す唯一のフック
  contexts/
    EarthquakeFeedProvider.tsx  useEarthquakeFeed を 1 回だけ実行し Sidebar/Map に配信
  components/
    EewBanner.tsx     緊急地震速報(未確定)の速報バナー
    TsunamiBanner.tsx 津波予報バナー
    ConnectionStatus.tsx  live / degraded(ポーリング中) / offline の表示
app/
  api/earthquakes/route.ts  初回描画+フォールバック専用に縮小、リトライ・タイムアウト・キャッシュ追加
```

`src/components/sidebar.tsx` と `src/components/mapdata.tsx` は独自の `fetch`/`setInterval` を削除し、
`EarthquakeFeedProvider` が提供するデータを購読するだけにする。

## 再接続・フォールバック仕様

- WebSocket は `onclose`/`onerror` で指数バックオフ(初回 1s、上限 30s、±20% ジッタ)で再接続。
- 再接続試行が一定回数(例: 5 回)失敗した場合、`degraded` 状態に遷移し `/api/earthquakes` を 5 秒間隔で
  ポーリングするフォールバックに切り替える。バックグラウンドで WS 再接続は継続し、成功したら即座に復帰。
- P2PQuake は「同一情報を複数回配信する可能性がある」と明記しているため、`id` で重複排除する。
- 初回マウント時は REST で直近データを取得してから WS 接続を張ることで、初期表示の空白を防ぐ。

## サーバー API (`/api/earthquakes`) の改善

- `AbortController` によるタイムアウト(例: 5 秒)を追加。
- 上流エラー時は指数バックオフで最大 2 回リトライ。
- 全リトライ失敗時は 502 とエラーボディを返し、`console.error` で構造化ログを出す(スタック/上流ステータス含む)。
- レスポンスに `Cache-Control: public, max-age=3, stale-while-revalidate=10` 程度の短期キャッシュを付与し、
  同時アクセスによる上流への負荷集中を緩和する。

## 見つかった問題の修正一覧(優先度付き)

### High
- `sidebar.tsx`: 空の `catch` がエラーを握りつぶし、一時的な通信失敗で表示中リストが全消去される
- `mapdata.tsx`: fetch に `try/catch` も `AbortController` もなく、レスポンス順序が入れ替わった場合の
  競合状態(古いデータが新しい state を上書き)が起こり得る
- Sidebar/Map の二重独立ポーリング(データ不整合 + 通信量倍増)
- 自前 API が上流レート制限を考慮しておらず、アクセス増で全ユーザーに 429 が波及し得る

### Medium
- `polygonStyle`(map.tsx)が feature ごとに `JSON.stringify` 比較で実質 O(n²)
- `stations.find`/`AreaName.findIndex` がポイントごとの線形探索(O(n×m))→ `Map` に置換
- `getShindoIcon` が毎レンダーで `L.icon()` を再生成 → scale ごとにメモ化
- `ApiEarthquakeEntry` の `[key: string]: unknown` と `as ValidEarthquakeEntry` キャストによる型安全性の欠如
- `JMAPoints.ts` の `JMAPoints`(41KB)・`AreaKana`・`centerPoint` が未使用のデッドコード
- ログが皆無(本番障害時に調査不能) → 開発/本番を分離した最小ロガー導入
- テスト基盤なし → Vitest + React Testing Library 導入

### Low
- "EarthRader"/"earthrader" の表記ゆれ(リポジトリ名 "earthradar" に統一)
- `layout.tsx` の不要なテンプレートリテラル、`page.tsx` の不要な Fragment
- `geojson` 型が package.json に明示されていない暗黙の transitive 依存

## テスト方針

- **Unit**: `lib/p2pquake/guards.ts` の型ガード、`utils/` の変換関数
- **Integration**: `/api/earthquakes` ルート(P2PQuake `/history` をモックし、成功/タイムアウト/上流エラーの
  各ケースを検証)
- **Hook**: `useEarthquakeFeed` を疑似 WebSocket サーバー(`vitest-websocket-mock` 等)でテストし、
  再接続・フォールバック遷移・重複排除を検証

Vitest + React Testing Library を devDependencies に追加する(現状テスト基盤なしのため新規導入)。

## 対象外(スコープ外として明示)

- JMA 公式防災情報 XML フィード等、契約が必要な有償/要申請の情報源との連携(個人開発の範囲を超えるため)
- code 561(地震感知情報)/9611(評価結果)の活用(P2PQuake 独自の群衆検知であり、信頼性担保の設計が
  別途必要になるため今回は対象外。YAGNI)
- i18n / アクセシビリティ改善(ユーザー要求に含まれないため)
