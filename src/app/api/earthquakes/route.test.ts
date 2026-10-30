// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { GET } from "./route";

describe("GET /api/earthquakes", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns parsed P2PQuake messages with a short cache header on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: "1", time: "t", code: 551, earthquake: { time: "t", maxScale: 10 }, points: [] },
        { id: "2", time: "t", code: 999 }, // 未知コードは除外される
      ],
    }) as unknown as typeof fetch;

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("max-age");
    expect(body).toHaveLength(1);
    expect(body[0].code).toBe(551);
  });

  it("returns 502 with a Japanese error message when upstream fails repeatedly", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error).toBeTruthy();
  }, 10000);
});
