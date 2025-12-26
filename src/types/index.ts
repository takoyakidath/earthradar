// 地震データの型定義

export interface Hypocenter {
  latitude: number;
  longitude: number;
  depth: number;
  magnitude: number;
  name?: string;
}

export interface Earthquake {
  time: string;
  hypocenter?: Hypocenter | null;
  maxScale: number;
  domesticTsunami?: string;
}

export interface Point {
  addr: string;
  scale: number;
  isArea: boolean;
}

export interface ApiEarthquakeEntry {
  id: string;
  earthquake?: Earthquake;
  points?: Point[];
  [key: string]: unknown;
}

export interface ValidEarthquakeEntry extends ApiEarthquakeEntry {
  points: Point[];
  earthquake: Earthquake;
}

// サイドバー用の地震データ
export interface EarthquakeData {
  id: string;
  date: string;
  location: string;
  magnitude: number;
  depth: number;
  intensity?: string;
  tsunami: boolean;
}

// マップ用の地震データ
export interface MapEarthquake {
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

// JMA観測点データ
export interface JMAStation {
  name: string;
  lat: number;
  lon: number;
  furigana: string;
  area: { name: string };
}
