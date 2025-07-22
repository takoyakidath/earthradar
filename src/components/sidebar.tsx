// @ts-nocheck
'use client'

import { useEffect, useState } from "react";
import Earthquake from "./earthquake";

interface EarthquakeData {
  id: string;
  date: string;
  location: string;
  magnitude: number;
  depth: number;
  intensity?: string;
  tsunami: boolean;
}

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const [earthquakes, setEarthquakes] = useState<EarthquakeData[]>([]);

  useEffect(() => {
    const fetchData = () => {
      fetch("/api/earthquakes")
        .then((res) => res.json())
        .then((data) => {
          const converted = data
            .filter((d: any) => d.earthquake?.hypocenter)
            .map(convertToCardData);
          setEarthquakes(converted);
        });
    };
  
    fetchData(); 
    const interval = setInterval(fetchData, 30000); 
  
    return () => clearInterval(interval); 
  }, []);
  

  return (
    <div className="flex">
      <div className="w-64 h-screen bg-gray-800 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-gray-700">EarthQuake</div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {earthquakes.map((eq) => (
            <Earthquake key={eq.id + eq.date} data={eq} />
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
          &copy; 2025 EarthQuake
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function convertToCardData(entry: any): EarthquakeData {
  return {
    id: entry.id,
    date: entry.earthquake.time,
    location: entry.earthquake.hypocenter.name || "不明",
    magnitude: entry.earthquake.hypocenter.magnitude,
    depth: entry.earthquake.hypocenter.depth,
    intensity: convertMaxScaleToText(entry.earthquake.maxScale),
    tsunami: entry.earthquake.domesticTsunami === "Warning" || entry.earthquake.domesticTsunami === "Watch",
  };
}

function convertMaxScaleToText(scale: number): string | undefined {
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
  return map[scale] || undefined;
}
