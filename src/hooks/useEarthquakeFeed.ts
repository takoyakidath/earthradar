"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { P2PQuakeMessage, JMAQuakeMessage, EewMessage, JMATsunamiMessage } from "@/types";
import { isJMAQuake, isEew, isJMATsunami, parseP2PQuakeMessage } from "@/lib/p2pquake/guards";
import { createP2PQuakeSocket, type SocketStatus } from "@/lib/p2pquake/socket";

const FALLBACK_POLL_INTERVAL_MS = 5000;
const MAX_QUAKES_RETAINED = 50;

export interface EarthquakeFeedState {
  quakes: JMAQuakeMessage[];
  latestEew: EewMessage | null;
  latestTsunami: JMATsunamiMessage | null;
  status: SocketStatus;
}

const initialState: EarthquakeFeedState = {
  quakes: [],
  latestEew: null,
  latestTsunami: null,
  status: "connecting",
};

/** 1件のメッセージを現在の状態にマージする(id で重複排除、最新順を維持) */
const mergeMessage = (
  state: EarthquakeFeedState,
  message: P2PQuakeMessage
): EarthquakeFeedState => {
  if (isJMAQuake(message)) {
    if (state.quakes.some((quake) => quake.id === message.id)) return state;
    return { ...state, quakes: [message, ...state.quakes].slice(0, MAX_QUAKES_RETAINED) };
  }
  if (isEew(message)) {
    return { ...state, latestEew: message.cancelled ? null : message };
  }
  if (isJMATsunami(message)) {
    return { ...state, latestTsunami: message.cancelled ? null : message };
  }
  return state; // code 554 (EEW検出) は状態を持たない通知トリガーのため無視する
};

export const useEarthquakeFeed = (): EarthquakeFeedState & { dismissEew: () => void } => {
  const [state, setState] = useState<EarthquakeFeedState>(initialState);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadInitial = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/earthquakes", { signal });
      if (!res.ok) return;
      const rawMessages: unknown[] = await res.json();
      const messages = rawMessages
        .map(parseP2PQuakeMessage)
        .filter((msg): msg is P2PQuakeMessage => msg !== null);

      setState((prev) => {
        let next = prev;
        // API は新しい順で返すため、prepend 型の mergeMessage で正しい順序になるよう古い順に処理する
        for (const message of [...messages].reverse()) {
          next = mergeMessage(next, message);
        }
        return next;
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("[useEarthquakeFeed] initial load failed", error);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadInitial(controller.signal);

    const socket = createP2PQuakeSocket({
      onMessage: (message) => setState((prev) => mergeMessage(prev, message)),
      onStatusChange: (status) => setState((prev) => ({ ...prev, status })),
    });

    return () => {
      controller.abort();
      socket.close();
    };
  }, [loadInitial]);

  useEffect(() => {
    if (state.status === "degraded") {
      pollTimerRef.current = setInterval(() => loadInitial(), FALLBACK_POLL_INTERVAL_MS);
    } else if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [state.status, loadInitial]);

  const dismissEew = useCallback(() => {
    setState((prev) => ({ ...prev, latestEew: null }));
  }, []);

  return { ...state, dismissEew };
};
