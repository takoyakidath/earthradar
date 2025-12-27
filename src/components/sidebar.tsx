'use client';

import { useEffect, useState, ReactNode } from 'react';
import Earthquake from './earthquake';
import type { ApiEarthquakeEntry } from '@/types';
import { convertToCardData } from '@/utils';

import type { EarthquakeData } from '@/types';

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
          EarthRader
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {earthquakes.map((eq) => (
            <Earthquake key={eq.id} data={eq} />
          ))}
        </nav>
        <footer className="p-4 border-t border-gray-700 text-sm text-gray-400">
          &copy; 2025 EarthRader
        </footer>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}

