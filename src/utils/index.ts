import type { JMAQuakeMessage, EarthquakeData } from "@/types";

/** 文字列から空白文字(全角・半角)を削除して正規化 */
export const normalize = (s: string): string => s.replace(/\s|　/g, "").trim();

/** 気象庁 maxScale の公式enum(-1,10,20,30,40,45,50,55,60,70)に対応する震度テキスト */
const maxScaleTextMap: Record<number, string> = {
  10: "震度1",
  20: "震度2",
  30: "震度3",
  40: "震度4",
  45: "震度5弱",
  50: "震度5強",
  55: "震度6弱",
  60: "震度6強",
  70: "震度7",
};

export const convertMaxScaleToText = (scale: number): string | undefined => maxScaleTextMap[scale];

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

export const convertToCardData = (message: JMAQuakeMessage): EarthquakeData => ({
  id: message.id,
  date: message.earthquake.time,
  location: message.earthquake.hypocenter?.name ?? "不明",
  magnitude: message.earthquake.hypocenter?.magnitude ?? 0,
  depth: message.earthquake.hypocenter?.depth ?? 0,
  intensity: convertMaxScaleToText(message.earthquake.maxScale),
  tsunami:
    message.earthquake.domesticTsunami === "Warning" ||
    message.earthquake.domesticTsunami === "Watch",
});
