"use client";

import type { ReactNode } from "react";
import Earthquake from "./earthquake";
import AlertBanners from "./AlertBanners";
import ConnectionStatus from "./ConnectionStatus";
import { ThemeToggle } from "./ui/theme-toggle";
import { EmptyState } from "./ui/empty-state";
import { EarthquakeCardSkeleton } from "./ui/skeleton";
import { IconRadar, IconInbox } from "./ui/icons";
import { useEarthquakeFeedContext } from "@/contexts/EarthquakeFeedProvider";
import { convertToCardData, formatRelativeTime } from "@/utils";

export default function Sidebar({ children }: { children: ReactNode }) {
  const {
    quakes,
    latestEew,
    latestTsunami,
    status,
    lastUpdatedAt,
    selectedId,
    dismissEew,
    selectQuake,
  } = useEarthquakeFeedContext();
  const cards = quakes.map(convertToCardData);
  const isInitialLoading = status === "connecting" && cards.length === 0;

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-bg md:flex-row">
      <AlertBanners eew={latestEew} tsunami={latestTsunami} onDismissEew={dismissEew} />

      <a
        href="#quake-list"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-toast focus-visible:rounded-md focus-visible:bg-surface focus-visible:px-3 focus-visible:py-2 focus-visible:shadow-overlay"
      >
        地震情報リストへ移動
      </a>

      <aside className="order-2 flex h-[46vh] min-h-0 shrink-0 flex-col border-t border-border bg-surface md:order-1 md:h-full md:w-[380px] md:border-t-0 md:border-r">
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-soft text-brand">
              <IconRadar className="h-4.5 w-4.5" />
            </span>
            <span className="font-mono text-[15px] font-bold tracking-tight text-text-primary">
              EarthRadar
            </span>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <ConnectionStatus status={status} />
          {lastUpdatedAt && (
            <span className="text-[11px] tabular-nums text-text-tertiary">
              最終受信 {formatRelativeTime(lastUpdatedAt)}
            </span>
          )}
        </div>

        <nav
          id="quake-list"
          aria-label="最新の地震情報"
          className="scrollbar-thin flex-1 space-y-2 overflow-y-auto p-3"
        >
          {isInitialLoading &&
            Array.from({ length: 5 }).map((_, i) => <EarthquakeCardSkeleton key={i} />)}

          {!isInitialLoading && cards.length === 0 && (
            <EmptyState
              icon={<IconInbox className="h-8 w-8" />}
              title="地震情報はありません"
              description="新しい情報を受信すると自動的に表示されます"
            />
          )}

          {cards.map((card) => (
            <Earthquake
              key={card.id}
              data={card}
              selected={card.id === selectedId}
              onSelect={selectQuake}
            />
          ))}
        </nav>

        <footer className="border-t border-border px-4 py-3 text-[11px] text-text-tertiary">
          &copy; 2026 EarthRadar ・ データ提供:
          <a
            href="https://www.p2pquake.net/"
            target="_blank"
            rel="noreferrer"
            className="ml-1 underline decoration-border-strong underline-offset-2 hover:text-text-secondary"
          >
            P2P地震情報
          </a>
        </footer>
      </aside>

      <main className="relative order-1 min-h-0 flex-1 md:order-2">{children}</main>
    </div>
  );
}
