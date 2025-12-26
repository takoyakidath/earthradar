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
import type { MapEarthquake, JMAStation } from "@/types";
import { normalize } from "@/utils";
import { shindoColorMap, shindoIconMap, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/constants";

const FlyToEpicenter = ({ lat, lon }: { lat: number; lon: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 7, { duration: 1.5 });
  }, [lat, lon, map]);
  return null;
};

const getShindoIcon = (scale: number): L.Icon =>
  L.icon({
    iconUrl: `/intensity/jqk_${shindoIconMap[scale] ?? "int_"}.png`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -20],
  });

export default function MapData() {
  const [geoData, setGeoData] = useState<FeatureCollection<Geometry, GeoJsonProperties> | null>(null);
  const [stations, setStations] = useState<JMAStation[]>([]);
  const [earthquake, setEarthquake] = useState<MapEarthquake | null>(null);
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
      const data: MapEarthquake[] = await res.json();
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
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_MAP_ZOOM}
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
