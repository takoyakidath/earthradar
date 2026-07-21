"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useEarthquakeFeed,
  type EarthquakeFeedState,
  type EarthquakeFeedActions,
} from "@/hooks/useEarthquakeFeed";

type EarthquakeFeedContextValue = EarthquakeFeedState & EarthquakeFeedActions;

const EarthquakeFeedContext = createContext<EarthquakeFeedContextValue | null>(null);

export function EarthquakeFeedProvider({ children }: { children: ReactNode }) {
  const feed = useEarthquakeFeed();
  return (
    <EarthquakeFeedContext.Provider value={feed}>{children}</EarthquakeFeedContext.Provider>
  );
}

export function useEarthquakeFeedContext(): EarthquakeFeedContextValue {
  const context = useContext(EarthquakeFeedContext);
  if (!context) {
    throw new Error("useEarthquakeFeedContext must be used within EarthquakeFeedProvider");
  }
  return context;
}
