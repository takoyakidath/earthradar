"use client";
import { AreaName, AreaCode } from "./JMAPoints";
import { MapContainer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: any[];
}

interface Earthquake {
  id: string;
  earthquake: {
    time: string;
    hypocenter: {
      latitude: number;
      longitude: number;
    };
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
  area: {
    name: string;
  };
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

const normalize = (str: string) => str.replace(/\s|　/g, "").trim();

// 地図を震源地に移動するコンポーネント
function FlyToEpicenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([lat, lon], 7, { duration: 1.5 });
  }, [lat, lon, map]);

  return null;
}

export default function MapData() {
  const [geoData, setGeoData] = useState<GeoJsonFeatureCollection | null>(null);
  const [earthquake, setEarthquake] = useState<Earthquake | null>(null);
  const [stations, setStations] = useState<JMAStation[]>([]);
  const [filledMap, setFilledMap] = useState<Record<number, number>>({});

  useEffect(() => {
    Promise.all([
      fetch("/geojson/zone.geojson").then((res) => res.json()),
      fetch("/coordinate/JMAstations.json").then((res) => res.json()),
    ]).then(([geoJson, stationJson]) => {
      setGeoData(geoJson);
      setStations(stationJson);
    });
  }, []);

  useEffect(() => {
    if (!geoData) return;

    const fetchLatestEarthquake = () => {
      fetch("/api/earthquakes")
        .then((res) => res.json())
        .then((data: Earthquake[]) => {
          const sorted = data.sort(
            (a, b) =>
              new Date(b.earthquake.time).getTime() -
              new Date(a.earthquake.time).getTime()
          );
          setEarthquake(sorted[0]);

          const tmpMap: Record<number, number> = {};

          sorted[0].points.forEach((point) => {
            if (point.isArea) return;
            const station = stations.find(
              (s) => normalize(s.name) === normalize(point.addr)
            );
            if (!station || !station.area?.name) return;
            const idx = AreaName.findIndex(
              (n) => normalize(n) === normalize(station.area.name)
            );
            if (idx === -1) return;
            const code = AreaCode[idx];
            if (!tmpMap[code] || tmpMap[code] < point.scale) {
              tmpMap[code] = point.scale;
            }
          });

          setFilledMap(tmpMap);
        });
    };

    fetchLatestEarthquake();
    const interval = setInterval(fetchLatestEarthquake, 10000);
    return () => clearInterval(interval);
  }, [geoData, stations]);

  const epicenterIcon = L.icon({
    iconUrl: "/epicenter.png",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -30],
  });

  const getShindoIcon = (scale: number) => {
    const level =
      scale === 10 ? "int1" :
      scale === 20 ? "int2" :
      scale === 30 ? "int3" :
      scale === 40 ? "int4" :
      scale === 45 ? "int50" :
      scale === 46 ? "int_" :
      scale === 50 ? "int55" :
      scale === 55 ? "int60" :
      scale === 60 ? "int65" :
      scale === 70 ? "int7" : "int_";
    return L.icon({
      iconUrl: `/intensity/jqk_${level}.png`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -20],
    });
  };

  const polygonStyle = (feature: any) => {
    const index = geoData?.features.indexOf(feature);
    if (index === undefined || index === -1) return {};
    const areaCode = AreaCode[index];
    const scale = filledMap[areaCode];
    const fillColor = scale ? shindoColorMap[scale] : "#3a3a3a";
    return {
      color: "#ffffff",
      weight: 1.5,
      opacity: 1,
      fillColor,
      fillOpacity: 1,
    };
  };

  return (
    <div style={{ height: "100vh", width: "100%", background: "#1d1d1d" }}>
      <MapContainer
        center={[36.575, 137.984]}
        zoom={6}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        {geoData && (
          <GeoJSON data={geoData} style={polygonStyle} />
        )}

        {earthquake && (
          <>
            {/* 地図移動処理 */}
            <FlyToEpicenter
              lat={earthquake.earthquake.hypocenter.latitude}
              lon={earthquake.earthquake.hypocenter.longitude}
            />

            {/* 震源地 */}
            <Marker
              position={[
                earthquake.earthquake.hypocenter.latitude,
                earthquake.earthquake.hypocenter.longitude,
              ]}
              icon={epicenterIcon}
            />

            {/* 観測点マーカー */}
            {earthquake.points.map((point, idx) => {
              const station = stations.find(
                (s) => normalize(s.name) === normalize(point.addr)
              );
              if (!station || point.isArea) return null;
              return (
                <Marker
                  key={`obs-${idx}`}
                  position={[station.lat, station.lon]}
                  icon={getShindoIcon(point.scale)}
                >
                  <Popup>
                    {station.name}({station.furigana})<br />
                    震度: {point.scale / 10}
                  </Popup>
                </Marker>
              );
            })}
          </>
        )}
      </MapContainer>
    </div>
  );
}
