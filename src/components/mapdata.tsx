"use client";

import { MapContainer, GeoJSON, Marker, Popup } from "react-leaflet";
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
}

export default function MapData() {
  const [geoData, setGeoData] = useState<GeoJsonFeatureCollection | null>(null);
  const [earthquake, setEarthquake] = useState<Earthquake | null>(null);
  const [stations, setStations] = useState<JMAStation[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/geojson/zone.geojson").then((res) => res.json()),
      fetch("/coordinate/JMAstations.json").then((res) => res.json())
    ]).then(([geoJson, stationJson]) => {
      setGeoData(geoJson);
      setStations(stationJson);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;

    const fetchLatestEarthquake = () => {
      fetch("/api/earthquakes")
        .then((res) => res.json())
        .then((data: Earthquake[]) => {
          const sorted = data.sort(
            (a, b) => new Date(b.earthquake.time).getTime() - new Date(a.earthquake.time).getTime()
          );
          setEarthquake(sorted[0]);
        });
    };
    fetchLatestEarthquake();
    const interval = setInterval(fetchLatestEarthquake, 10000);
    return () => clearInterval(interval);
  }, [ready]);

  const polygonStyle = {
    color: "#ffffff",
    weight: 1.5,
    opacity: 1,
    fillColor: "#3a3a3a",
    fillOpacity: 1,
  };

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

  const epicenterIcon = L.icon({
    iconUrl: "/epicenter.png",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -30],
  });

  const normalize = (str: string) => str.replace(/\s| |(.*?)/g, "").trim();

  return (
    <div style={{ height: "100vh", width: "100%", background: "#1d1d1d" }}>
      <MapContainer
        center={[36.575, 137.984]}
        zoom={5}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        {geoData && <GeoJSON data={geoData} style={polygonStyle} />}

        {earthquake && (
          <>
            <Marker
              position={[
                earthquake.earthquake.hypocenter.latitude,
                earthquake.earthquake.hypocenter.longitude,
              ]}
              icon={epicenterIcon}
            />

            {earthquake.points.map((point, idx) => {
              const station = stations.find((s) => normalize(s.name) === normalize(point.addr));
              if (!station || point.isArea) return null;
              return (
                <Marker
                  key={`obs-${idx}`}
                  position={[station.lat, station.lon]}
                  icon={getShindoIcon(point.scale)}
                >
                  <Popup>
                    {station.name}({station.furigana})<br />震度: {point.scale / 10}
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