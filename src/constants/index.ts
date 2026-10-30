// 定数定義

/**
 * 震度スケールと色のマッピング（マップ用）
 */
export const shindoColorMap: Record<number, string> = {
  10: "rgb(107, 120, 120)",
  20: "rgb(30, 110, 230)",
  30: "rgb(0, 200, 200)",
  40: "rgb(250, 250, 100)",
  45: "rgb(255, 180, 0)",
  46: "rgb(255, 180, 0)",
  50: "rgb(255, 120, 0)",
  55: "rgb(230, 0, 0)",
  60: "rgb(160, 0, 0)",
  70: "rgb(150, 0, 150)",
};

/**
 * 震度スケールとアイコンファイル名のマッピング
 */
export const shindoIconMap: Record<number, string> = {
  10: "int1",
  20: "int2",
  30: "int3",
  40: "int4",
  45: "int50",
  46: "int_",
  50: "int55",
  55: "int60",
  60: "int65",
  70: "int7",
};

/**
 * デフォルトのマップ中心座標（日本）
 */
export const DEFAULT_MAP_CENTER: [number, number] = [36.575, 137.984];

/**
 * デフォルトのマップズームレベル
 */
export const DEFAULT_MAP_ZOOM = 6;

/**
 * 震度スケール(気象庁 maxScale enum)ごとの表示メタ情報。
 * サイドバーのバッジと地図のポリゴン塗りで同じ色基準を共有し、視覚的な一貫性を保つ。
 */
export interface SeverityMeta {
  scale: number;
  label: string;
  short: string;
  color: string;
  foreground: string;
}

export const SEVERITY_LEVELS: SeverityMeta[] = [
  { scale: 10, label: "震度1", short: "1", color: "rgb(107,120,120)", foreground: "#ffffff" },
  { scale: 20, label: "震度2", short: "2", color: "rgb(30,110,230)", foreground: "#ffffff" },
  { scale: 30, label: "震度3", short: "3", color: "rgb(0,200,200)", foreground: "#062024" },
  { scale: 40, label: "震度4", short: "4", color: "rgb(250,250,100)", foreground: "#3d3800" },
  { scale: 45, label: "震度5弱", short: "5-", color: "rgb(255,180,0)", foreground: "#3d2600" },
  { scale: 50, label: "震度5強", short: "5+", color: "rgb(255,120,0)", foreground: "#ffffff" },
  { scale: 55, label: "震度6弱", short: "6-", color: "rgb(230,0,0)", foreground: "#ffffff" },
  { scale: 60, label: "震度6強", short: "6+", color: "rgb(160,0,0)", foreground: "#ffffff" },
  { scale: 70, label: "震度7", short: "7", color: "rgb(150,0,150)", foreground: "#ffffff" },
];

/** 震度が不明・未観測のときのニュートラルな表示色 */
export const SEVERITY_UNKNOWN: SeverityMeta = {
  scale: -1,
  label: "震度不明",
  short: "?",
  color: "var(--color-border-strong)",
  foreground: "var(--color-text-secondary)",
};
