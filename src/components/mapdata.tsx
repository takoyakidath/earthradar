"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { MapContainer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import L, { type StyleFunction } from "leaflet";
import "leaflet/dist/leaflet.css";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
} from "geojson";

import { AreaName, AreaCode, centerPoint } from "./JMAPoints";

interface Earthquake {
  id: string;
  issue?: { type?: string };
  earthquake: {
    time: string;
    hypocenter: { latitude: number; longitude: number; name?: string; magnitude?: number; depth?: number };
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

const normalize = (s = "") => s.replace(/\s|　/g, "").trim();

function MapPanes() {
  const map = useMap();
  useEffect(() => {
    const setPane = (name: string, z: number) => {
      const pane = map.getPane(name) ?? map.createPane(name);
      pane.style.zIndex = String(z);
    };

    setPane("pane_map1", 1);
    setPane("pane_map2", 2);
    setPane("pane_map3", 3);
    setPane("pane_map_filled", 5);

    // マーカー用のペインを明示的に作成（既存コードでは未作成）
    setPane("markerPane", 700);

    Object.keys(shindoColorMap)
      .map((k) => Number(k))
      .forEach((s) => setPane(`shindo${s}`, 600 + s));

    setPane("shingen", 1000);
    setPane("tsunami_map", 1010);
  }, [map]);
  return null;
}

function FlyTo({ lat, lon, zoom = 8 }: { lat: number; lon: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], zoom, { duration: 0.6 });
  }, [lat, lon, zoom, map]);
  return null;
}

const iconNameByScale: Record<number, string> = {
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

// アイコンキャッシュを用いて同じアイコンの再生成を防ぐ
const _shindoIconCache = new Map<number, L.Icon>();
const getShindoIcon = (scale: number): L.Icon => {
  const key = scale ?? -1;
  const cached = _shindoIconCache.get(key);
  if (cached) return cached;
  const url = `/intensity/jqk_${iconNameByScale[scale] ?? "int_"}.png`;
  const icon = L.icon({
    iconUrl: url,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -18],
  });
  _shindoIconCache.set(key, icon);
  return icon;
};

const formatMap: Record<number, string> = {
  10: "1",
  20: "2",
  30: "3",
  40: "4",
  45: "5弱",
  46: "5弱以上(推定)",
  50: "5強",
  55: "6弱",
  60: "6強",
  70: "7",
};

function formatMaxScale(s: number) {
  return formatMap[s] ?? "不明";
}

export default function MapData() {
  const [geoData, setGeoData] =
    useState<FeatureCollection<Geometry, GeoJsonProperties> | null>(null);
  const [stations, setStations] = useState<JMAStation[]>([]);
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [selectedEarthquakeIndex, setSelectedEarthquakeIndex] = useState(0);

  const [filledAreaScales, setFilledAreaScales] = useState<Record<number, number>>({});

  const selected = earthquakes[selectedEarthquakeIndex] ?? null;

  const stationByName = useMemo(() => {
    const stationMap = new Map<string, JMAStation>();
    for (const s of stations) stationMap.set(normalize(s.name), s);
    return stationMap;
  }, [stations]);

  // geojson + station 読み込み
  useEffect(() => {
    (async () => {
      const [geoJson, stationsData] = await Promise.all([
        fetch("/geojson/zone.geojson").then((r) => r.json()),
        fetch("/coordinate/JMAstations.json").then((r) => r.json()),
      ]);

      // ★ feature index を properties に埋める（AreaCode配列とズレない前提）
      const withIdx = {
        ...geoJson,
        features: geoJson.features.map((f: Feature<Geometry, GeoJsonProperties>, i: number) => ({
          ...f,
          properties: { ...(f.properties ?? {}), __idx: i },
        })),
      } as FeatureCollection<Geometry, GeoJsonProperties>;

      setGeoData(withIdx);
      setStations(stationsData);
    })();
  }, []);

  const fetchEarthquakes = useCallback(async (limit = 20) => {
    const res = await fetch(`/api/earthquakes?limit=${limit}`, { cache: "no-store" });
    const data: Earthquake[] = await res.json();
    setEarthquakes(data);
    setSelectedEarthquakeIndex(0);
  }, []);

  useEffect(() => {
    fetchEarthquakes(20);
    const id = setInterval(() => fetchEarthquakes(20), 10000);
    return () => clearInterval(id);
  }, [fetchEarthquakes]);

  useEffect(() => {
    if (!selected) return;

    const areaScaleMap: Record<number, number> = {};

    const isScalePrompt = selected.issue?.type === "ScalePrompt";

    for (const point of selected.points) {
      if (isScalePrompt) {
        const areaIndex = AreaName.findIndex((n) => normalize(n) === normalize(point.addr));
        if (areaIndex === -1) continue;
        const code = AreaCode[areaIndex];
        if (!areaScaleMap[code] || areaScaleMap[code] < point.scale) areaScaleMap[code] = point.scale;
        continue;
      }

      if (point.isArea) continue;
      const station = stationByName.get(normalize(point.addr));
      if (!station?.area?.name) continue;

      const areaIndex = AreaName.findIndex((n) => normalize(n) === normalize(station.area.name));
      if (areaIndex === -1) continue;

      const code = AreaCode[areaIndex];
      if (!areaScaleMap[code] || areaScaleMap[code] < point.scale) areaScaleMap[code] = point.scale;
    }

    setFilledAreaScales(areaScaleMap);
  }, [selected, stationByName]);

  const epicenterIcon = useMemo(
    () =>
      L.icon({
        iconUrl: "/epicenter.png",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -28],
      }),
    []
  );

  // GeoJSON塗りつぶし
  const polygonStyle: StyleFunction<Feature<Geometry, GeoJsonProperties>> = (feature) => {
    const props = feature?.properties as Record<string, unknown> | undefined;
    const featureIndex = (props && (props.__idx as number | undefined)) ?? undefined;
    const areaCode = typeof featureIndex === "number" ? AreaCode[featureIndex] : undefined;
    const scale = areaCode ? filledAreaScales[areaCode] : undefined;

    return {
      color: "#ffffff",
      weight: 1.2,
      opacity: 1,
      fillColor: scale ? shindoColorMap[scale] : "#3a3a3a",
      fillOpacity: 1,
    };
  };

  // --- ここを改良: 震度速報（ScalePrompt）は地区ごとに集約して1つだけマーカーを作成する ---
  const areaMarkers = useMemo(() => {
    if (!selected) return [];
    if (selected.issue?.type !== "ScalePrompt") return [];

    // areaCode -> { scale, name }
    const aggregated: Record<number, { scale: number; name: string }> = {};

    for (const point of selected.points) {
      const areaIndex = AreaName.findIndex((n) => normalize(n) === normalize(point.addr));
      if (areaIndex === -1) continue;
      const code = AreaCode[areaIndex];
      const name = AreaName[areaIndex] ?? point.addr;
      if (!aggregated[code] || aggregated[code].scale < point.scale) {
        aggregated[code] = { scale: point.scale, name };
      }
    }

    return Object.entries(aggregated).map(([codeStr, info]) => {
      const code = Number(codeStr);
      const center = centerPoint[String(code) as keyof typeof centerPoint] as { lat: number; lng: number } | undefined;
      if (!center) return null;
      return {
        key: `area-${code}`,
        lat: center.lat,
        lon: center.lng,
        scale: info.scale,
        name: info.name,
      };
    }).filter(Boolean) as { key: string; lat: number; lon: number; scale: number; name: string }[];
  }, [selected]);

  // 通常のとき：観測点にアイコンを置く
  const stationMarkers = useMemo(() => {
    if (!selected) return [];
    if (selected.issue?.type === "ScalePrompt") return [];

    return selected.points
      .map((point, i) => {
        if (point.isArea) return null;
        const station = stationByName.get(normalize(point.addr));
        if (!station) return null;
        return { key: `pt-${i}`, lat: station.lat, lon: station.lon, scale: point.scale, name: point.addr };
      })
      .filter(Boolean) as { key: string; lat: number; lon: number; scale: number; name: string }[];
  }, [selected, stationByName]);

  const flyTarget = useMemo(() => {
    if (!selected) return null;

    // ScalePrompt のときは中心点平均で飛ぶ（集約後の areaMarkers を使用）
    if (selected.issue?.type === "ScalePrompt" && areaMarkers.length) {
      const lat = areaMarkers.reduce((a, b) => a + b.lat, 0) / areaMarkers.length;
      const lon = areaMarkers.reduce((a, b) => a + b.lon, 0) / areaMarkers.length;
      return { lat, lon, zoom: 7 };
    }

    const lat = selected.earthquake.hypocenter.latitude;
    const lon = selected.earthquake.hypocenter.longitude;
    if (lat == null || lon == null) return null;
    return { lat, lon, zoom: 8 };
  }, [selected, areaMarkers]);

  return (
    <div className="w-full h-screen bg-[#1d1d1d] relative">

      <MapContainer
        center={[36.575, 137.984]}
        zoom={6}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <MapPanes />

        {geoData && (
          <GeoJSON
            data={geoData}
            style={polygonStyle}
            pane="pane_map_filled"
          />
        )}

        {flyTarget && <FlyTo lat={flyTarget.lat} lon={flyTarget.lon} zoom={flyTarget.zoom} />}

        {/* 震源 */}
        {selected && selected.earthquake.hypocenter.latitude && selected.earthquake.hypocenter.longitude && (
          <Marker
            position={[selected.earthquake.hypocenter.latitude, selected.earthquake.hypocenter.longitude]}
            icon={epicenterIcon}
            pane="shingen"
          >
            <Popup>
              <div className="text-sm">
                <div>発生: {selected.earthquake.time}</div>
                <div>最大震度: {formatMaxScale(selected.earthquake.maxScale)}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 観測点（通常） */}
        {stationMarkers.map((marker) => (
          <Marker
            key={marker.key}
            position={[marker.lat, marker.lon]}
            icon={getShindoIcon(marker.scale)}
            pane="markerPane"
          />
        ))}

        {/* 地域（震度速報：地区ごとに1つ） */}
        {areaMarkers.map((marker) => (
          <Marker
            key={marker.key}
            position={[marker.lat, marker.lon]}
            icon={getShindoIcon(marker.scale)}
            pane="markerPane"
          >
            <Popup>{marker.name} / 震度 {formatMaxScale(marker.scale)}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
