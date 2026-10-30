import type {
  P2PQuakeMessage,
  JMAQuakeMessage,
  JMATsunamiMessage,
  EewDetectionMessage,
  EewMessage,
  Hypocenter,
} from "@/types";

const KNOWN_CODES = new Set([551, 552, 554, 556]);

export const isJMAQuake = (msg: P2PQuakeMessage): msg is JMAQuakeMessage => msg.code === 551;

export const isJMATsunami = (msg: P2PQuakeMessage): msg is JMATsunamiMessage => msg.code === 552;

export const isEewDetection = (msg: P2PQuakeMessage): msg is EewDetectionMessage => msg.code === 554;

export const isEew = (msg: P2PQuakeMessage): msg is EewMessage => msg.code === 556;

/**
 * P2PQuake は震源情報が存在しない場合、緯度経度に -200 を返す(公式仕様書に明記)。
 * 座標の妥当範囲チェックと合わせてこれを弾く。
 */
export const hasValidHypocenter = (
  hypocenter: Hypocenter | undefined
): hypocenter is Hypocenter =>
  hypocenter !== undefined &&
  hypocenter.latitude >= -90 &&
  hypocenter.latitude <= 90 &&
  hypocenter.longitude >= -180 &&
  hypocenter.longitude <= 180;

/** REST/WebSocket 両方から来る unknown な JSON を安全に P2PQuakeMessage へ絞り込む */
export const parseP2PQuakeMessage = (raw: unknown): P2PQuakeMessage | null => {
  if (typeof raw !== "object" || raw === null || !("code" in raw)) return null;
  const code = (raw as { code: unknown }).code;
  if (typeof code === "number" && KNOWN_CODES.has(code)) {
    return raw as P2PQuakeMessage;
  }
  return null;
};
