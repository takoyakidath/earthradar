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
