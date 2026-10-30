"use client";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { IconRadar } from "./ui/icons";

export default function Map() {
  const MapData = useMemo(
    () =>
      dynamic(() => import("./mapdata"), {
        loading: () => (
          <div className="flex h-full w-full items-center justify-center bg-surface-sunken">
            <div className="flex flex-col items-center gap-3 text-text-tertiary">
              <IconRadar className="h-8 w-8 animate-radar-sweep text-brand" />
              <p className="text-sm">地図を読み込んでいます…</p>
            </div>
          </div>
        ),
        ssr: false,
      }),
    []
  );
  return <MapData />;
}
