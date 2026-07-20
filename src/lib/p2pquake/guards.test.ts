import { describe, it, expect } from "vitest";
import {
  isJMAQuake,
  isEew,
  hasValidHypocenter,
  parseP2PQuakeMessage,
} from "./guards";
import type { P2PQuakeMessage } from "@/types";

describe("parseP2PQuakeMessage", () => {
  it("returns null for non-object input", () => {
    expect(parseP2PQuakeMessage("not an object")).toBeNull();
    expect(parseP2PQuakeMessage(null)).toBeNull();
  });

  it("returns null for an unrecognized code", () => {
    expect(parseP2PQuakeMessage({ code: 999 })).toBeNull();
  });

  it("returns the message unchanged for a recognized code", () => {
    const raw = { id: "abc", time: "t", code: 551, earthquake: { time: "t", maxScale: 10 }, points: [] };
    expect(parseP2PQuakeMessage(raw)).toEqual(raw);
  });
});

describe("isJMAQuake / isEew", () => {
  it("discriminates messages by their code field", () => {
    const quake = { code: 551 } as unknown as P2PQuakeMessage;
    const eew = { code: 556 } as unknown as P2PQuakeMessage;
    expect(isJMAQuake(quake)).toBe(true);
    expect(isEew(quake)).toBe(false);
    expect(isEew(eew)).toBe(true);
  });
});

describe("hasValidHypocenter", () => {
  it("rejects P2PQuake's -200/-1 'no data' sentinel values", () => {
    expect(
      hasValidHypocenter({ latitude: -200, longitude: -200, depth: -1, magnitude: -1 })
    ).toBe(false);
  });

  it("accepts real coordinates", () => {
    expect(
      hasValidHypocenter({ latitude: 35.6, longitude: 139.7, depth: 10, magnitude: 4.5 })
    ).toBe(true);
  });

  it("rejects undefined", () => {
    expect(hasValidHypocenter(undefined)).toBe(false);
  });
});
