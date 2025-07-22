"use client"
import dynamic from "next/dynamic";
import React from "react";

function MapPage() {
  const MapData = React.useMemo(
    () =>
      dynamic(() => import("../components/mapdata"), {
        loading: () => <p>A map is loading</p>,
        ssr: false,
      }),
    []
  );
  return <MapData />;
}

export default MapPage;