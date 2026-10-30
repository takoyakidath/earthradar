// P2PQuake JSON API v2 のスキーマに対応する型定義
// 参照: https://github.com/p2pquake/epsp-specifications/blob/master/json-api-v2.yaml

export interface Hypocenter {
  name?: string;
  latitude: number;
  longitude: number;
  depth: number;
  magnitude: number;
}

export type DomesticTsunami =
  | "None"
  | "Unknown"
  | "Checking"
  | "NonEffective"
  | "Watch"
  | "Warning";

export interface QuakePoint {
  pref: string;
  addr: string;
  isArea: boolean;
  scale: number;
}

interface BasicData {
  id: string;
  time: string;
}

export interface JMAQuakeMessage extends BasicData {
  code: 551;
  earthquake: {
    time: string;
    hypocenter?: Hypocenter;
    maxScale: number;
    domesticTsunami?: DomesticTsunami;
  };
  points: QuakePoint[];
}

export interface TsunamiArea {
  grade: "MajorWarning" | "Warning" | "Watch" | "Unknown";
  immediate: boolean;
  name: string;
}

export interface JMATsunamiMessage extends BasicData {
  code: 552;
  cancelled: boolean;
  areas: TsunamiArea[];
}

export interface EewDetectionMessage extends BasicData {
  code: 554;
  type: "Full" | "Chime";
}

export interface EewHypocenter {
  name?: string;
  reduceName?: string;
  latitude: number;
  longitude: number;
  depth: number;
  magnitude: number;
}

export interface EewArea {
  pref: string;
  name: string;
  scaleFrom: number;
  scaleTo: number;
  kindCode?: string;
  arrivalTime?: string | null;
}

export interface EewMessage extends BasicData {
  code: 556;
  cancelled: boolean;
  earthquake?: {
    originTime: string;
    arrivalTime: string;
    hypocenter?: EewHypocenter;
  };
  issue: { time: string; eventId: string; serial: string };
  areas: EewArea[];
}

export type P2PQuakeMessage =
  | JMAQuakeMessage
  | JMATsunamiMessage
  | EewDetectionMessage
  | EewMessage;

/** サイドバー用の地震カードデータ */
export interface EarthquakeData {
  id: string;
  date: string;
  location: string;
  magnitude: number;
  depth: number;
  intensity?: string;
  tsunami: boolean;
}

/** JMA観測点データ */
export interface JMAStation {
  name: string;
  lat: number;
  lon: number;
  furigana: string;
  area: { name: string };
}
