"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import L, { type StyleFunction } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from "geojson";

import { AreaName, AreaCode } from "./JMAPoints";
import type { JMAStation } from "@/types";
import { hasValidHypocenter } from "@/lib/p2pquake/guards";
import { normalize, convertMaxScaleToText } from "@/utils";
import { useEarthquakeFeedContext } from "@/contexts/EarthquakeFeedProvider";
import { shindoColorMap, shindoIconMap, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/constants";
import { MapLegend } from "./MapLegend";

const FlyToEpicenter = ({ lat, lon }: { lat: number; lon: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 7, { duration: 1.5 });
  }, [lat, lon, map]);
  return null;
};

const DEFAULT_ICON_OPTIONS = {
  iconSize: [24, 24] as [number, number],
  iconAnchor: [12, 12] as [number, number],
  popupAnchor: [0, -20] as [number, number],
};

export default function MapData() {
  const [geoData, setGeoData] = useState<FeatureCollection<Geometry, GeoJsonProperties> | null>(null);
  const [stations, setStations] = useState<JMAStation[]>([]);
  const { quakes, selectedId } = useEarthquakeFeedContext();

  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      try {
        const [geoJson, stationJson] = await Promise.all([
          fetch("/geojson/zone.geojson", { signal: controller.signal }).then((res) => res.json()),
          fetch("/coordinate/JMAstations.json", { signal: controller.signal }).then((res) => res.json()),
        ]);
        setGeoData(geoJson as FeatureCollection<Geometry, GeoJsonProperties>);
        setStations(stationJson);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("[MapData] failed to load static map data", error);
      }
    };
    loadData();
    return () => controller.abort();
  }, []);

  const shindoIcons = useMemo(() => {
    const icons = new Map<number, L.Icon>();
    for (const [scaleKey, fileSuffix] of Object.entries(shindoIconMap)) {
      icons.set(
        Number(scaleKey),
        L.icon({ iconUrl: `/intensity/jqk_${fileSuffix}.png`, ...DEFAULT_ICON_OPTIONS })
      );
    }
    return icons;
  }, []);

  const defaultShindoIcon = useMemo(
    () => L.icon({ iconUrl: "/intensity/jqk_int_.png", ...DEFAULT_ICON_OPTIONS }),
    []
  );

  const getShindoIcon = (scale: number): L.Icon => shindoIcons.get(scale) ?? defaultShindoIcon;

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

  const stationByNormalizedName = useMemo(() => {
    const map = new Map<string, JMAStation>();
    for (const station of stations) map.set(normalize(station.name), station);
    return map;
  }, [stations]);

  const areaCodeByNormalizedAreaName = useMemo(() => {
    const map = new Map<string, number>();
    AreaName.forEach((name, idx) => map.set(normalize(name), AreaCode[idx]));
    return map;
  }, []);

  const areaCodeByFeature = useMemo(() => {
    const map = new Map<Feature<Geometry, GeoJsonProperties>, number>();
    if (!geoData) return map;
    geoData.features.forEach((feature, idx) => map.set(feature, AreaCode[idx]));
    return map;
  }, [geoData]);

  const latestQuake = useMemo(
    () => quakes.find((quake) => hasValidHypocenter(quake.earthquake.hypocenter)),
    [quakes]
  );

  const selectedQuake = useMemo(
    () =>
      selectedId
        ? quakes.find(
            (quake) => quake.id === selectedId && hasValidHypocenter(quake.earthquake.hypocenter)
          )
        : undefined,
    [quakes, selectedId]
  );

  // サイドバーでカードを選択している間はその地震を表示、それ以外は最新の地震を表示する
  const activeQuake = selectedQuake ?? latestQuake;

  const filledMap = useMemo(() => {
    const result: Record<number, number> = {};
    if (!activeQuake) return result;
    for (const point of activeQuake.points) {
      if (point.isArea) continue;
      const station = stationByNormalizedName.get(normalize(point.addr));
      if (!station?.area?.name) continue;
      const areaCode = areaCodeByNormalizedAreaName.get(normalize(station.area.name));
      if (areaCode === undefined) continue;
      if (!result[areaCode] || result[areaCode] < point.scale) {
        result[areaCode] = point.scale;
      }
    }
    return result;
  }, [activeQuake, stationByNormalizedName, areaCodeByNormalizedAreaName]);

  const polygonStyle: StyleFunction<Feature<Geometry, GeoJsonProperties>> = (feature) => {
    const areaCode = feature ? areaCodeByFeature.get(feature) : undefined;
    const scale = areaCode !== undefined ? filledMap[areaCode] : undefined;

    return {
      color: "#fff",
      weight: 1.5,
      opacity: 1,
      fillColor: scale ? shindoColorMap[scale] : "#3a3a3a",
      fillOpacity: 1,
    };
  };

  return (
    <div className="relative h-full w-full bg-[#0c0f14]">
      <MapContainer
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_MAP_ZOOM}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        {geoData && <GeoJSON data={geoData} style={polygonStyle} />}
        {activeQuake?.earthquake.hypocenter && (
          <>
            <FlyToEpicenter
              lat={activeQuake.earthquake.hypocenter.latitude}
              lon={activeQuake.earthquake.hypocenter.longitude}
            />
            <Marker
              position={[
                activeQuake.earthquake.hypocenter.latitude,
                activeQuake.earthquake.hypocenter.longitude,
              ]}
              icon={epicenterIcon}
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold">{activeQuake.earthquake.hypocenter.name ?? "震源不明"}</p>
                  <p className="tabular-nums">
                    M{activeQuake.earthquake.hypocenter.magnitude} ／ 深さ{" "}
                    {activeQuake.earthquake.hypocenter.depth}km
                  </p>
                  {convertMaxScaleToText(activeQuake.earthquake.maxScale) && (
                    <p>最大 {convertMaxScaleToText(activeQuake.earthquake.maxScale)}</p>
                  )}
                </div>
              </Popup>
            </Marker>
            {activeQuake.points.map((point, i) => {
              if (point.isArea) return null;
              const station = stationByNormalizedName.get(normalize(point.addr));
              if (!station) return null;
              return (
                <Marker
                  key={`pt-${i}`}
                  position={[station.lat, station.lon]}
                  icon={getShindoIcon(point.scale)}
                >
                  <Popup>
                    <div className="text-xs">
                      <p className="font-semibold">{station.name}</p>
                      <p>{convertMaxScaleToText(point.scale) ?? "震度不明"}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </>
        )}
      </MapContainer>

      <MapLegend />
    </div>
  );
}
