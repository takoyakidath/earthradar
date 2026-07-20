"use client";

import type { ReactNode } from "react";
import Earthquake from "./earthquake";
import AlertBanners from "./AlertBanners";
import ConnectionStatus from "./ConnectionStatus";
import { useEarthquakeFeedContext } from "@/contexts/EarthquakeFeedProvider";
import { convertToCardData } from "@/utils";

export default function Sidebar({ children }: { children: ReactNode }) {
  const { quakes, latestEew, latestTsunami, status, dismissEew } = useEarthquakeFeedContext();
  const cards = quakes.map(convertToCardData);

  return (
    <div className="flex">
      <AlertBanners eew={latestEew} tsunami={latestTsunami} onDismissEew={dismissEew} />
      <aside className="w-64 h-screen bg-gray-800 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-gray-700">EarthRadar</div>
        <ConnectionStatus status={status} />
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {cards.map((card) => (
            <Earthquake key={card.id} data={card} />
          ))}
        </nav>
        <footer className="p-4 border-t border-gray-700 text-sm text-gray-400">
          &copy; 2026 EarthRadar
        </footer>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
