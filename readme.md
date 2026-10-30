# EarthRadar

日本の地震・津波・緊急地震速報(EEW)をリアルタイムに可視化する監視ダッシュボード。

[P2P地震情報](https://www.p2pquake.net/) の WebSocket 配信にブラウザから直接接続し、地図とサイドバーで最新の地震情報を確認できます。

## 特徴

- **低遅延**: 自前サーバーを中継せず、ブラウザから `wss://api.p2pquake.net/v2/ws` に直結
- **EEW 対応**: 緊急地震速報(未確定値)・津波予報バナーを表示(気象庁公式の代替ではない旨を明示)
- **自動フォールバック**: WebSocket 切断時は指数バックオフで再接続しつつ、`/api/earthquakes` の REST ポーリングに自動切替
- **地図表示**: 震源地・観測点ごとの震度を Leaflet 地図上にプロット

## 技術スタック

- [Next.js](https://nextjs.org/) 15 (App Router, Turbopack)
- React 19 / TypeScript
- [Leaflet](https://leafletjs.com/) / react-leaflet
- Tailwind CSS 4
- Vitest / React Testing Library

## セットアップ

```bash
bun install
bun run dev
```

[http://localhost:3000](http://localhost:3000) を開いて確認できます。

## スクリプト

| コマンド | 説明 |
|---|---|
| `bun run dev` | 開発サーバーを起動 |
| `bun run build` | 本番ビルド |
| `bun run start` | 本番サーバーを起動 |
| `bun run lint` | ESLint を実行 |
| `bun run test` | Vitest でテストを実行 |
| `bun run test:watch` | Vitest をウォッチモードで実行 |

## ディレクトリ構成

```
src/
  app/                Next.js App Router (ページ, API Route)
  components/         UI コンポーネント(地図・サイドバー・バナーなど)
  contexts/           EarthquakeFeedProvider (地震情報配信の唯一のソース)
  hooks/              useEarthquakeFeed (WebSocket + REST フォールバック統合)
  lib/p2pquake/       P2PQuake クライアント(型ガード・REST・WebSocket)
  types/              P2PQuake メッセージの型定義
docs/
  superpowers/        設計ドキュメント・実装計画
```

アーキテクチャの詳細は [`docs/superpowers/specs`](docs/superpowers/specs) を参照してください。

## データソース

地震・津波・EEW 情報は [P2P地震情報 API](https://www.p2pquake.net/) から取得しています。EEW は速報値・未確定であり、気象庁公式の緊急地震速報の代替として利用しないでください。

## ライセンス

[LICENSE](LICENSE) を参照してください。
