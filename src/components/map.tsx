"use client";
import dynamic from "next/dynamic";
import { useMemo } from "react";

export default function Map() {
  const MapData = useMemo(
    () =>
      dynamic(() => import("./mapdata"), {
        loading: () => (
          <div className="flex items-center justify-center h-screen bg-[#1d1d1d] text-white">
            <p>地図を読み込んでいます...</p>
          </div>
        ),
        ssr: false,
      }),
    []
  );
  return <MapData />;
}
