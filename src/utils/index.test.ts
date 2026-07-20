import { describe, it, expect } from "vitest";
import { convertMaxScaleToText, getColorByIntensity, convertToCardData, normalize } from "./index";
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

describe("getColorByIntensity", () => {
  it("returns a distinct background class per intensity band", () => {
    expect(getColorByIntensity("震度5弱")).toBe("bg-orange-300");
    expect(getColorByIntensity(undefined)).toBe("bg-gray-300");
  });
});
