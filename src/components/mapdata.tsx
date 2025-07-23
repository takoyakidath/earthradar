"use client";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  GeoJSON,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { AreaName, AreaCode } from "./JMAPoints";

interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: any[];
}

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

// 色分け用震度マップ
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

// 正規化関数
const normalize = (s: string) => s.replace(/\s|　/g, "").trim();

// 地図移動コンポーネント
const FlyToEpicenter = ({ lat, lon }: { lat: number; lon: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 7, { duration: 1.5 });
  }, [lat, lon]);
  return null;
};

// 震度アイコン生成
const getShindoIcon = (scale: number): L.Icon => {
  const map: Record<number, string> = {
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
  };
  const level = map[scale] || "int_";
  return L.icon({
    iconUrl: `/intensity/jqk_${level}.png`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -20],
  });
};

export default function MapData() {
  const [geoData, setGeoData] = useState<GeoJsonFeatureCollection | null>(null);
  const [stations, setStations] = useState<JMAStation[]>([]);
  const [earthquake, setEarthquake] = useState<Earthquake | null>(null);
  const [filledMap, setFilledMap] = useState<Record<number, number>>({});

  // 地図・観測点初期ロード
  useEffect(() => {
    Promise.all([
      fetch("/geojson/zone.geojson").then((res) => res.json()),
      fetch("/coordinate/JMAstations.json").then((res) => res.json()),
    ]).then(([geoJson, stationJson]) => {
      setGeoData(geoJson);
      setStations(stationJson);
    });
  }, []);

  // 地震情報のポーリング
  useEffect(() => {
    if (!geoData) return;

    const fetchLatestEarthquake = async () => {
      const res = await fetch("/api/earthquakes");
      const data: Earthquake[] = await res.json();
      const latest = data
        .filter((d) => d?.earthquake?.hypocenter?.latitude)
        .sort((a, b) => new Date(b.earthquake.time).getTime() - new Date(a.earthquake.time).getTime())[0];

      setEarthquake(latest);

      // 塗りつぶしデータ生成
      const tmp: Record<number, number> = {};
      latest.points.forEach((p) => {
        if (p.isArea) return;
        const s = stations.find((s) => normalize(s.name) === normalize(p.addr));
        if (!s?.area?.name) return;
        const idx = AreaName.findIndex((n) => normalize(n) === normalize(s.area.name));
        if (idx === -1) return;
        const code = AreaCode[idx as number];
        if (!tmp[code] || tmp[code] < p.scale) tmp[code] = p.scale;
      });
      setFilledMap(tmp);
    };

    fetchLatestEarthquake();
    const id = setInterval(fetchLatestEarthquake, 10000);
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

  const polygonStyle = (feature: any) => {
    const idx = geoData?.features.indexOf(feature);
    const areaCode = idx !== undefined && idx >= 0 ? AreaCode[idx] : undefined;
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
      <MapContainer center={[36.575, 137.984]} zoom={6} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        {geoData && <GeoJSON data={geoData} style={polygonStyle} />}
        {earthquake && (
          <>
            <FlyToEpicenter lat={earthquake.earthquake.hypocenter.latitude} lon={earthquake.earthquake.hypocenter.longitude} />
            <Marker position={[earthquake.earthquake.hypocenter.latitude, earthquake.earthquake.hypocenter.longitude]} icon={epicenterIcon} />
            {earthquake.points.map((p, i) => {
              if (p.isArea) return null;
              const station = stations.find((s) => normalize(s.name) === normalize(p.addr));
              if (!station) return null;
              return (
                <Marker key={`pt-${i}`} position={[station.lat, station.lon]} icon={getShindoIcon(p.scale)} />
              );
            })}
          </>
        )}
      </MapContainer>
    </div>
  );
}
