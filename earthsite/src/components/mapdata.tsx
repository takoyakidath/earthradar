"use client";

import { MapContainer, TileLayer, GeoJSON, Marker, Popup  } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const MapData = () => {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch("/geojson/zone.geojson") 
      .then((res) => res.json())
      .then((data) => setGeoData(data));
  }, []);

  const polygonStyle = {
    color: "#ffffff",      
    weight: 1.5,           
    opacity: 1,
    fillColor: "#3a3a3a",  
    fillOpacity: 1
  };
  const epicenterIconImage = L.icon({
    iconUrl: '/epicenter.png',
    iconSize: [40,40],
    iconAnchor: [20, 20],
    popupAnchor: [0,-40]
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
        <Marker position={[35.2, 140.9]} icon={epicenterIconImage} />
      </MapContainer>
    </div>
  );
};

export default MapData;
