import type { P2PQuakeMessage } from "@/types";
import { parseP2PQuakeMessage } from "./guards";

const WS_URL = "wss://api.p2pquake.net/v2/ws";
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const DEGRADE_AFTER_ATTEMPTS = 5;

export type SocketStatus = "connecting" | "live" | "degraded" | "closed";

interface P2PQuakeSocketHandlers {
  onMessage: (message: P2PQuakeMessage) => void;
  onStatusChange: (status: SocketStatus) => void;
}

export const createP2PQuakeSocket = (handlers: P2PQuakeSocketHandlers): { close: () => void } => {
  let ws: WebSocket | null = null;
  let attempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closedByCaller = false;

  const scheduleReconnect = () => {
    if (closedByCaller) return;
    attempt += 1;
    handlers.onStatusChange(attempt > DEGRADE_AFTER_ATTEMPTS ? "degraded" : "connecting");
    const backoff = Math.min(INITIAL_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS);
    const jitter = backoff * (0.8 + Math.random() * 0.4);
    reconnectTimer = setTimeout(connect, jitter);
  };

  function connect() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      attempt = 0;
      handlers.onStatusChange("live");
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const parsed: unknown = JSON.parse(String(event.data));
        const message = parseP2PQuakeMessage(parsed);
        if (message) handlers.onMessage(message);
      } catch {
        // P2PQuake 側の一時的な不正フレームは無視して接続を維持する
      }
    };

    ws.onerror = () => {
      ws?.close();
    };

    ws.onclose = () => {
      if (!closedByCaller) scheduleReconnect();
    };
  }

  connect();

  return {
    close: () => {
      closedByCaller = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
      handlers.onStatusChange("closed");
    },
  };
};
