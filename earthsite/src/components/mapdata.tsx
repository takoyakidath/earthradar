"use client";

import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const MapData = () => {
  const [geoData, setGeoData] = useState<any>(null);
  const [earthquakes, setEarthquakes] = useState<any[]>([]);

  useEffect(() => {
    // 一度だけGeoJSONを読み込む
    fetch("/geojson/zone.geojson")
      .then((res) => res.json())
      .then((data) => setGeoData(data));
  }, []);

  useEffect(() => {
    const fetchLatestEarthquake = () => {
      fetch("/api/earthquakes")
        .then((res) => res.json())
        .then((data) => {
          const sorted = data.sort(
            (a: { earthquake: { time: string | number | Date; }; }, b: { earthquake: { time: string | number | Date; }; }) => new Date(b.earthquake.time).getTime() - new Date(a.earthquake.time).getTime()
          );

          const latest = sorted[0];
          setEarthquakes(latest ? [latest] : []);
        });
    };

    // 初回取得
    fetchLatestEarthquake();

    // 10秒おきに更新
    const intervalId = setInterval(fetchLatestEarthquake, 10000);

    // クリーンアップ
    return () => clearInterval(intervalId);
  }, []);

  const polygonStyle = {
    color: "#ffffff",
    weight: 1.5,
    opacity: 1,
    fillColor: "#3a3a3a",
    fillOpacity: 1,
  };

  const epicenterIconImage = L.icon({
    iconUrl: "/epicenter.png",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -40],
  });

  return (
    <div style={{ height: "100vh", width: "100%", background: "#1d1d1d" }}>
      <MapContainer
        center={[36.575, 137.984]}
        zoom={5}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ height: "100%", width: "100%", background: "#1d1d1d" }}
      >
        {geoData && <GeoJSON data={geoData} style={polygonStyle} />}

        {earthquakes.map((eq) => {
          const { latitude, longitude, name, magnitude, depth } = eq.earthquake.hypocenter;
          const maxScale = eq.earthquake.maxScale;

          return (
            <Marker
              key={eq.id}
              position={[latitude, longitude]}
              icon={epicenterIconImage}
            >
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapData;
