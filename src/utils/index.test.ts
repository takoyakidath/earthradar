import { describe, it, expect } from "vitest";
import {
  convertMaxScaleToText,
  getSeverityMeta,
  formatRelativeTime,
  convertToCardData,
  normalize,
} from "./index";
import type { JMAQuakeMessage } from "@/types";

describe("convertMaxScaleToText", () => {
  it("matches the official JMA maxScale enum (45/50/55/60/70), not the old off-by-one-notch mapping", () => {
    expect(convertMaxScaleToText(45)).toBe("震度5弱");
    expect(convertMaxScaleToText(50)).toBe("震度5強");
    expect(convertMaxScaleToText(55)).toBe("震度6弱");
    expect(convertMaxScaleToText(60)).toBe("震度6強");
    expect(convertMaxScaleToText(70)).toBe("震度7");
  });

  it("returns undefined for -1 (震度情報なし) instead of a wrong label", () => {
    expect(convertMaxScaleToText(-1)).toBeUndefined();
  });
});

describe("normalize", () => {
  it("strips both full-width and half-width spaces", () => {
    expect(normalize("東京都 千代田区　丸の内")).toBe("東京都千代田区丸の内");
  });
});

describe("convertToCardData", () => {
  it("maps a JMAQuakeMessage (code 551) into sidebar card data", () => {
    const message: JMAQuakeMessage = {
      id: "abc",
      time: "2026/01/01 00:00:00",
      code: 551,
      earthquake: {
        time: "2026/01/01 00:00:00",
        hypocenter: { name: "東京湾", latitude: 35.5, longitude: 139.8, depth: 30, magnitude: 4.5 },
        maxScale: 45,
        domesticTsunami: "None",
      },
      points: [],
    };

    expect(convertToCardData(message)).toEqual({
      id: "abc",
      date: "2026/01/01 00:00:00",
      location: "東京湾",
      magnitude: 4.5,
      depth: 30,
      intensity: "震度5弱",
      tsunami: false,
    });
  });

  it("falls back to sensible defaults when hypocenter is missing", () => {
    const message: JMAQuakeMessage = {
      id: "xyz",
      time: "t",
      code: 551,
      earthquake: { time: "t", maxScale: -1 },
      points: [],
    };

    expect(convertToCardData(message)).toEqual({
      id: "xyz",
      date: "t",
      location: "不明",
      magnitude: 0,
      depth: 0,
      intensity: undefined,
      tsunami: false,
    });
  });
});

describe("getSeverityMeta", () => {
  it("returns the shared color-scale entry matching the intensity label", () => {
    expect(getSeverityMeta("震度5弱")).toMatchObject({ scale: 45, color: "rgb(255,180,0)" });
    expect(getSeverityMeta("震度7")).toMatchObject({ scale: 70, color: "rgb(150,0,150)" });
  });

  it("falls back to a neutral entry when intensity is unknown", () => {
    expect(getSeverityMeta(undefined)).toMatchObject({ scale: -1 });
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-01-01T12:00:00+09:00").getTime();

  it("renders sub-minute gaps as たった今", () => {
    expect(formatRelativeTime("2026-01-01T11:59:45+09:00", now)).toBe("たった今");
  });

  it("renders minute and hour gaps in Japanese units", () => {
    expect(formatRelativeTime("2026-01-01T11:55:00+09:00", now)).toBe("5分前");
    expect(formatRelativeTime("2026-01-01T09:00:00+09:00", now)).toBe("3時間前");
  });

  it("falls back to an absolute date beyond 24 hours", () => {
    expect(formatRelativeTime("2025-12-30T12:00:00+09:00", now)).toContain("12/30");
  });
});
