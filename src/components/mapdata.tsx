"use client";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  GeoJSON,
  Marker,
  useMap,
} from "react-leaflet";
import L, { type StyleFunction } from "leaflet";
import "leaflet/dist/leaflet.css";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
} from "geojson";

import { AreaName, AreaCode } from "./JMAPoints";

interface Earthquake {
  id: string;
  earthquake: {
    time: string;
    hypocenter: { latitude: number; longitude: number };
    maxScale: number;
  };
  points: {
    addr: string;
    scale: number;
    isArea: boolean;
  }[];
}

interface JMAStation {
  name: string;
  lat: number;
  lon: number;
  furigana: string;
  area: { name: string };
}

const shindoColorMap: Record<number, string> = {
  10: "rgb(107, 120, 120)",
  20: "rgb(30, 110, 230)",
  30: "rgb(0, 200, 200)",
  40: "rgb(250, 250, 100)",
  45: "rgb(255, 180, 0)",
  46: "rgb(255, 180, 0)",
  50: "rgb(255, 120, 0)",
  55: "rgb(230, 0, 0)",
  60: "rgb(160, 0, 0)",
  70: "rgb(150, 0, 150)",
};

const normalize = (s: string) => s.replace(/\s|　/g, "").trim();

const FlyToEpicenter = ({ lat, lon }: { lat: number; lon: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 7, { duration: 1.5 });
  }, [lat, lon, map]);
  return null;
};

const getShindoIcon = (scale: number): L.Icon =>
  L.icon({
    iconUrl: `/intensity/jqk_${{
      10: "int1",
      20: "int2",
      30: "int3",
      40: "int4",
      45: "int50",
      46: "int_",
      50: "int55",
      55: "int60",
      60: "int65",
      70: "int7",
    }[scale] ?? "int_"}.png`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -20],
  });

export default function MapData() {
  const [geoData, setGeoData] = useState<FeatureCollection<Geometry, GeoJsonProperties> | null>(null);
  const [stations, setStations] = useState<JMAStation[]>([]);
  const [earthquake, setEarthquake] = useState<Earthquake | null>(null);
  const [filledMap, setFilledMap] = useState<Record<number, number>>({});

  useEffect(() => {
    const loadData = async () => {
      const [geoJson, stationJson] = await Promise.all([
        fetch("/geojson/zone.geojson").then((res) => res.json()),
        fetch("/coordinate/JMAstations.json").then((res) => res.json()),
      ]);
      setGeoData(geoJson as FeatureCollection<Geometry, GeoJsonProperties>);
      setStations(stationJson);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!geoData) return;

    const fetchEarthquake = async () => {
      const res = await fetch("/api/earthquakes");
      const data: Earthquake[] = await res.json();
      const latest = data
        .filter((d) => d?.earthquake?.hypocenter?.latitude)
        .sort(
          (a, b) =>
            new Date(b.earthquake.time).getTime() -
            new Date(a.earthquake.time).getTime()
        )[0];

      if (!latest) return;
      setEarthquake(latest);

      const tmp: Record<number, number> = {};
      for (const p of latest.points) {
        if (p.isArea) continue;
        const station = stations.find(
          (s) => normalize(s.name) === normalize(p.addr)
        );
        if (!station?.area?.name) continue;

        const idx = AreaName.findIndex(
          (n) => normalize(n) === normalize(station.area.name)
        );
        if (idx === -1) continue;

        const code = AreaCode[idx];
        if (!tmp[code] || tmp[code] < p.scale) tmp[code] = p.scale;
      }

      setFilledMap(tmp);
    };

    fetchEarthquake();
    const id = setInterval(fetchEarthquake, 10000);
    return () => clearInterval(id);
  }, [geoData, stations]);

  const epicenterIcon = useMemo(
    () =>
      L.icon({
        iconUrl: "/epicenter.png",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -30],
      }),
    []
  );

  const polygonStyle: StyleFunction<Feature<Geometry, GeoJsonProperties>> = (
    feature
  ) => {
    if (!feature || !geoData) {
      return {
        color: "#fff",
        weight: 1.5,
        opacity: 1,
        fillColor: "#3a3a3a",
        fillOpacity: 1,
      };
    }

    const idx = geoData.features.findIndex(
      (f) =>
        JSON.stringify(f.properties) === JSON.stringify(feature.properties)
    );
    const areaCode = idx !== -1 ? AreaCode[idx] : undefined;
    const scale = areaCode ? filledMap[areaCode] : undefined;

    return {
      color: "#fff",
      weight: 1.5,
      opacity: 1,
      fillColor: scale ? shindoColorMap[scale] : "#3a3a3a",
      fillOpacity: 1,
    };
  };

  return (
    <div className="w-full h-screen bg-[#1d1d1d]">
      <MapContainer
        center={[36.575, 137.984]}
        zoom={6}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        {geoData && <GeoJSON data={geoData} style={polygonStyle} />}
        {earthquake && (
          <>
            <FlyToEpicenter
              lat={earthquake.earthquake.hypocenter.latitude}
              lon={earthquake.earthquake.hypocenter.longitude}
            />
            <Marker
              position={[
                earthquake.earthquake.hypocenter.latitude,
                earthquake.earthquake.hypocenter.longitude,
              ]}
              icon={epicenterIcon}
            />
            {earthquake.points.map((p, i) => {
              if (p.isArea) return null;
              const station = stations.find(
                (s) => normalize(s.name) === normalize(p.addr)
              );
              if (!station) return null;
              return (
                <Marker
                  key={`pt-${i}`}
                  position={[station.lat, station.lon]}
                  icon={getShindoIcon(p.scale)}
                />
              );
            })}
          </>
        )}
      </MapContainer>
    </div>
  );
}
