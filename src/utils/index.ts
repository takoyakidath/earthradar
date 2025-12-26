// ユーティリティ関数

/**
 * 文字列から空白文字（全角・半角）を削除して正規化
 */
export const normalize = (s: string): string => {
  return s.replace(/\s|　/g, "").trim();
};

/**
 * 震度スケールをテキストに変換
 */
export const convertMaxScaleToText = (scale: number): string | undefined => {
  const map: Record<number, string> = {
    10: "震度1",
    20: "震度2",
    30: "震度3",
    40: "震度4",
    50: "震度5弱",
    55: "震度5強",
    60: "震度6弱",
    65: "震度6強",
    70: "震度7",
  };
  return map[scale];
};

/**
 * 震度テキストから背景色を取得
 */
export const getColorByIntensity = (intensity?: string): string => {
  if (!intensity) return "bg-gray-300";

  if (intensity.includes("震度1")) return "bg-green-100";
  if (intensity.includes("震度2")) return "bg-yellow-100";
  if (intensity.includes("震度3")) return "bg-yellow-200";
  if (intensity.includes("震度4")) return "bg-orange-200";
  if (intensity.includes("震度5弱")) return "bg-orange-300";
  if (intensity.includes("震度5強")) return "bg-red-300";
  if (intensity.includes("震度6弱")) return "bg-red-400";
  if (intensity.includes("震度6強")) return "bg-red-500";
  if (intensity.includes("震度7")) return "bg-red-600";

  return "bg-gray-300";
};

/**
 * APIレスポンスをサイドバー用のデータに変換
 */
import type { ApiEarthquakeEntry, EarthquakeData } from "../types";

export const convertToCardData = (entry: ApiEarthquakeEntry): EarthquakeData => {
  return {
    id: entry.id,
    date: entry.earthquake?.time ?? "",
    location: entry.earthquake?.hypocenter?.name ?? "不明",
    magnitude: entry.earthquake?.hypocenter?.magnitude ?? 0,
    depth: entry.earthquake?.hypocenter?.depth ?? 0,
    intensity: entry.earthquake?.maxScale
      ? convertMaxScaleToText(entry.earthquake.maxScale)
      : undefined,
    tsunami:
      entry.earthquake?.domesticTsunami === "Warning" ||
      entry.earthquake?.domesticTsunami === "Watch",
  };
};
