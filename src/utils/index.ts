import type { JMAQuakeMessage, EarthquakeData } from "@/types";
import { SEVERITY_LEVELS, SEVERITY_UNKNOWN, type SeverityMeta } from "@/constants";

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

/** 震度テキスト("震度5弱"など)から、地図と共通のカラースケール定義を引く */
export const getSeverityMeta = (intensity?: string): SeverityMeta => {
  if (!intensity) return SEVERITY_UNKNOWN;
  const match = SEVERITY_LEVELS.find((level) => intensity.includes(level.label));
  return match ?? SEVERITY_UNKNOWN;
};

/** 相対時刻表示("たった今" / "3分前" / "2時間前")。24時間以上前は絶対日時にフォールバック */
export const formatRelativeTime = (iso: string, now: number = Date.now()): string => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 60) return "たった今";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}時間前`;

  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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
