
"use client";
import { JMAPoints } from "@/components/JMAPoints";
import { MapContainer, GeoJSON, Marker } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
  
// GeoJSONの型（簡易）
type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: any[]; // 必要に応じて詳細型に
};

// 地震データの型
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
}

interface JMAStations{
  code: string;                
  name: string;                
  furigana: string;            
  lat: string;               
  lon: string;               
  affi: string;               

  pref: {
    name: string;          
    code: number;            
    furigana: string;          
  };

  city: {
    code: string;             
    name: string;             
    furigana: string;       
  };

  area: {
    code: string;              
    name: string;              
    furigana: string;          
  };
}

export default function MapData(){
  const [geoData, setGeoData] = useState<GeoJsonFeatureCollection | null>(null);
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
 const [JMAStationData,setJMAStationData] = useState<JMAStations[]>();

  useEffect(() => {
    // 一度だけGeoJSONを読み込む
    fetch("/geojson/zone.geojson")
      .then((res) => res.json())
      .then((data: GeoJsonFeatureCollection) => setGeoData(data));
    fetch("/coordinate/JMAStaions.json")
      .then((res) => res.json())
      .then((data: JMAStations[]) => setJMAStationData(data))
  }, []);

  useEffect(() => {
    const fetchLatestEarthquake = () => {
      fetch("/api/earthquakes")
        .then((res) => res.json())
        .then((data: Earthquake[]) => {
          const sorted = data.sort(
            (a, b) => new Date(b.earthquake.time).getTime() - new Date(a.earthquake.time).getTime()
          );

          const latest = sorted[0];
          setEarthquakes(latest ? [latest] : []);
        });
    };


    fetchLatestEarthquake();

    const intervalId = setInterval(fetchLatestEarthquake, 10000);

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
          const { latitude, longitude } = eq.earthquake.hypocenter;

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


