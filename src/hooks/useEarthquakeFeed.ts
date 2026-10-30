"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { P2PQuakeMessage, JMAQuakeMessage, EewMessage, JMATsunamiMessage } from "@/types";
import { isJMAQuake, isEew, isJMATsunami, parseP2PQuakeMessage } from "@/lib/p2pquake/guards";
import { createP2PQuakeSocket, type SocketStatus } from "@/lib/p2pquake/socket";
import {
  initAlertSound,
  playEewAlertSound,
  playTsunamiAlertSound,
  startEewAlarmLoop,
} from "@/lib/alertSound";

const FALLBACK_POLL_INTERVAL_MS = 5000;
const MAX_QUAKES_RETAINED = 50;
/** P2PQuake の scale 値。45 = 震度5弱(気象庁 maxScale enum) */
const SEVERE_EEW_SCALE_THRESHOLD = 45;

const getMaxScaleTo = (eew: EewMessage): number =>
  eew.areas.reduce((max, area) => Math.max(max, area.scaleTo), -1);

export interface EarthquakeFeedState {
  quakes: JMAQuakeMessage[];
  latestEew: EewMessage | null;
  latestTsunami: JMATsunamiMessage | null;
  status: SocketStatus;
  lastUpdatedAt: string | null;
  selectedId: string | null;
}

const initialState: EarthquakeFeedState = {
  quakes: [],
  latestEew: null,
  latestTsunami: null,
  status: "connecting",
  lastUpdatedAt: null,
  selectedId: null,
};

/** 1件のメッセージを現在の状態にマージする(id で重複排除、最新順を維持) */
const mergeMessage = (
  state: EarthquakeFeedState,
  message: P2PQuakeMessage,
  receivedAt: string
): EarthquakeFeedState => {
  if (isJMAQuake(message)) {
    if (state.quakes.some((quake) => quake.id === message.id)) return state;
    return {
      ...state,
      quakes: [message, ...state.quakes].slice(0, MAX_QUAKES_RETAINED),
      lastUpdatedAt: receivedAt,
    };
  }
  if (isEew(message)) {
    return { ...state, latestEew: message.cancelled ? null : message, lastUpdatedAt: receivedAt };
  }
  if (isJMATsunami(message)) {
    return {
      ...state,
      latestTsunami: message.cancelled ? null : message,
      lastUpdatedAt: receivedAt,
    };
  }
  return state; // code 554 (EEW検出) は状態を持たない通知トリガーのため無視する
};

export interface EarthquakeFeedActions {
  dismissEew: () => void;
  selectQuake: (id: string | null) => void;
}

export const useEarthquakeFeed = (): EarthquakeFeedState & EarthquakeFeedActions => {
  const [state, setState] = useState<EarthquakeFeedState>(initialState);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAnnouncedEewEventIdRef = useRef<string | null>(null);
  const eewAlarmRef = useRef<{ stop: () => void; eventId: string } | null>(null);

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
        const receivedAt = new Date().toISOString();
        // API は新しい順で返すため、prepend 型の mergeMessage で正しい順序になるよう古い順に処理する
        for (const message of [...messages].reverse()) {
          next = mergeMessage(next, message, receivedAt);
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

    const stopAlertSoundInit = initAlertSound();

    const socket = createP2PQuakeSocket({
      onMessage: (message) => {
        // 同じ地震の続報(serial違い)で毎回鳴らさないよう、eventId単位で1回だけ通知する
        if (isEew(message) && !message.cancelled) {
          const eventId = message.issue.eventId;
          if (lastAnnouncedEewEventIdRef.current !== eventId) {
            lastAnnouncedEewEventIdRef.current = eventId;
            playEewAlertSound();
          }
        } else if (isJMATsunami(message) && !message.cancelled) {
          playTsunamiAlertSound();
        }
        setState((prev) => mergeMessage(prev, message, new Date().toISOString()));
      },
      onStatusChange: (status) => setState((prev) => ({ ...prev, status })),
    });

    return () => {
      controller.abort();
      socket.close();
      stopAlertSoundInit();
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

  useEffect(() => {
    const eew = state.latestEew;
    // 震度5弱未満、またはEEWが消えた(取消/手動dismiss)場合は鳴らさない
    if (!eew || getMaxScaleTo(eew) < SEVERE_EEW_SCALE_THRESHOLD) {
      eewAlarmRef.current?.stop();
      eewAlarmRef.current = null;
      return;
    }
    // 同じ地震の続報(serial違い)で連打を再スタートしない
    if (eewAlarmRef.current?.eventId === eew.issue.eventId) return;

    eewAlarmRef.current?.stop();
    eewAlarmRef.current = { stop: startEewAlarmLoop(), eventId: eew.issue.eventId };
  }, [state.latestEew]);

  useEffect(() => {
    return () => eewAlarmRef.current?.stop();
  }, []);

  const dismissEew = useCallback(() => {
    setState((prev) => ({ ...prev, latestEew: null }));
  }, []);

  const selectQuake = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedId: id }));
  }, []);

  return { ...state, dismissEew, selectQuake };
};
