'use client';

import { useEffect, useState, ReactNode } from 'react';
import Earthquake from './earthquake';

interface EarthquakeData {
  id: string;
  date: string;
  location: string;
  magnitude: number;
  depth: number;
  intensity?: string;
  tsunami: boolean;
}

interface ApiEarthquakeEntry {
  id: string;
  earthquake: {
    time: string;
    hypocenter: {
      name?: string;
      magnitude: number;
      depth: number;
    } | null;
    maxScale: number;
    domesticTsunami: string;
  };
}

export default function Sidebar({ children }: { children: ReactNode }) {
  const [earthquakes, setEarthquakes] = useState<EarthquakeData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/earthquakes');
        if (!res.ok) throw new Error('データ取得に失敗しました');
        const data: ApiEarthquakeEntry[] = await res.json();
        const converted = data
          .filter((d) => d.earthquake?.hypocenter)
          .map(convertToCardData);
        setEarthquakes(converted);
      } catch {
        setEarthquakes([]);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex">
      <aside className="w-64 h-screen bg-gray-800 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-gray-700">
          EarthRader Dev
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {earthquakes.map((eq) => (
            <Earthquake key={eq.id} data={eq} />
          ))}
        </nav>
        <footer className="p-4 border-t border-gray-700 text-sm text-gray-400">
          &copy; 2025 EarthRader Dev
        </footer>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}

function convertToCardData(entry: ApiEarthquakeEntry): EarthquakeData {
  return {
    id: entry.id,
    date: entry.earthquake.time,
    location: entry.earthquake.hypocenter?.name ?? '不明',
    magnitude: entry.earthquake.hypocenter?.magnitude ?? 0,
    depth: entry.earthquake.hypocenter?.depth ?? 0,
    intensity: convertMaxScaleToText(entry.earthquake.maxScale),
    tsunami:
      entry.earthquake.domesticTsunami === 'Warning' ||
      entry.earthquake.domesticTsunami === 'Watch',
  };
}
function convertMaxScaleToText(scale: number): string | undefined {
  const map: Record<number, string> = {
    10: '震度1',
    20: '震度2',
    30: '震度3',
    40: '震度4',
    50: '震度5弱',
    55: '震度5強',
    60: '震度6弱',
    65: '震度6強',
    70: '震度7',
  };
  return map[scale];
}
