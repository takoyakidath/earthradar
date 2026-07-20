# Realtime Earthquake Architecture + Full Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current 10s/30s server-proxied polling of P2PQuake with a direct browser WebSocket
subscription (EEW-aware, auto-reconnecting, with REST fallback), and fix every correctness/perf/type-safety
issue found during the full-codebase read documented in
`docs/superpowers/specs/2026-07-20-realtime-earthquake-architecture-design.md`.

**Architecture:** Browser connects directly to `wss://api.p2pquake.net/v2/ws` (no self-hosted relay — a relay
can only add latency and requires infrastructure this project doesn't need). `/api/earthquakes` is kept but
demoted to "initial load + degraded-mode fallback poller" duty only. A single `EarthquakeFeedProvider` React
context replaces the two independent polling loops currently in `sidebar.tsx` and `mapdata.tsx`.

**Tech Stack:** Next.js 15 (App Router) + React 19 + TypeScript (strict) + Tailwind v4 + Leaflet/react-leaflet.
Testing: Vitest + React Testing Library (newly added, no test framework exists today). Package manager: **Bun**
(`bun.lock` is present — use `bun install` / `bun add`, never npm/yarn/pnpm).

## Global Constraints

- Package manager is Bun — all install commands must use `bun add` / `bun add -d`.
- TypeScript strict mode is already enabled (`tsconfig.json`) — do not weaken it, do not introduce `any`.
- P2PQuake WebSocket (production): `wss://api.p2pquake.net/v2/ws` — no auth, connect directly from the browser.
- P2PQuake REST history: `https://api.p2pquake.net/v2/history` — rate limit 60 req/min per IP; `/history` is
  ~0.5s slower than the WebSocket per the official spec.
- P2PQuake codes in scope: 551 (JMAQuake, confirmed), 552 (JMATsunami), 554 (EEW detection trigger),
  556 (EEW forecast). Codes 555/561/9611 are out of scope (see spec's "対象外" section).
- Official maxScale/scale enum (verified against `epsp-specifications/json-api-v2.yaml`): `-1, 10, 20, 30, 40,
  45, 50, 55, 60, 70` → 震度1, 震度2, 震度3, 震度4, 震度5弱, 震度5強, 震度6弱, 震度6強, 震度7. EEW `scaleFrom`/
  `scaleTo` additionally allow `0` and `99` ("〜程度以上").
- Any UI element that surfaces EEW/code 556 data MUST carry a visible disclaimer that it is preliminary/
  unconfirmed and is not an official replacement for JMA's 緊急地震速報 (per the spec's official-source
  disclaimer requirement).
- No new runtime dependencies are needed for the realtime feature (native `WebSocket`/`fetch`/`AbortController`
  only). New dependencies are test-only devDependencies.
- Do not remove `@vercel/analytics` from `layout.tsx`.

---

### Task 1: Add Vitest test infrastructure

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

**Interfaces:**
- Produces: `bun run test` (single run), `bun run test:watch` — used by every later task's test step.

- [ ] **Step 1: Install test dependencies**

```bash
bun add -d vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @types/geojson
```

- [ ] **Step 2: Add `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Add `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add scripts to `package.json`**

In the `"scripts"` block, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify the test runner boots with zero tests**

Run: `bun run test`
Expected: Vitest starts, reports "no test files found" (non-fatal) — this confirms config/alias resolution
works before any real test is written.

- [ ] **Step 6: Commit**

```bash
git add package.json vitest.config.ts vitest.setup.ts bun.lock
git commit -m "test: add Vitest + React Testing Library infrastructure"
```

---

### Task 2: Rewrite domain types as a discriminated union

**Files:**
- Modify: `src/types/index.ts` (full replacement)

**Interfaces:**
- Produces: `Hypocenter`, `DomesticTsunami`, `QuakePoint`, `JMAQuakeMessage`, `TsunamiArea`,
  `JMATsunamiMessage`, `EewDetectionMessage`, `EewHypocenter`, `EewArea`, `EewMessage`, `P2PQuakeMessage`
  (union of the four message types), `EarthquakeData` (sidebar card view model), `JMAStation` (unchanged
  shape). All later tasks import from here.

- [ ] **Step 1: Replace the full contents of `src/types/index.ts`**

```ts
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
```

- [ ] **Step 2: Confirm the project still type-checks the (now-broken) consumers**

Run: `bunx tsc --noEmit`
Expected: Multiple errors in `src/app/api/earthquakes/route.ts`, `src/components/sidebar.tsx`,
`src/components/mapdata.tsx`, `src/utils/index.ts` — this is expected; they are fixed in the following tasks.
Do not fix them here.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "refactor(types): replace ad-hoc earthquake types with a P2PQuake-schema-accurate discriminated union"
```

---

### Task 3: Type guards and safe parsing

**Files:**
- Create: `src/lib/p2pquake/guards.ts`
- Test: `src/lib/p2pquake/guards.test.ts`

**Interfaces:**
- Consumes: types from Task 2 (`P2PQuakeMessage`, `JMAQuakeMessage`, `JMATsunamiMessage`,
  `EewDetectionMessage`, `EewMessage`, `Hypocenter`).
- Produces: `isJMAQuake`, `isJMATsunami`, `isEewDetection`, `isEew` (type guards),
  `hasValidHypocenter(hypocenter: Hypocenter | undefined): hypocenter is Hypocenter`,
  `parseP2PQuakeMessage(raw: unknown): P2PQuakeMessage | null`. Used by Task 4 (REST), Task 6 (WebSocket),
  Task 7 (hook), Task 9 (utils), Task 12 (map).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/p2pquake/guards.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/lib/p2pquake/guards.test.ts`
Expected: FAIL — `./guards` module does not exist yet.

- [ ] **Step 3: Implement `src/lib/p2pquake/guards.ts`**

```ts
import type {
  P2PQuakeMessage,
  JMAQuakeMessage,
  JMATsunamiMessage,
  EewDetectionMessage,
  EewMessage,
  Hypocenter,
} from "@/types";

const KNOWN_CODES = new Set([551, 552, 554, 556]);

export const isJMAQuake = (msg: P2PQuakeMessage): msg is JMAQuakeMessage => msg.code === 551;

export const isJMATsunami = (msg: P2PQuakeMessage): msg is JMATsunamiMessage => msg.code === 552;

export const isEewDetection = (msg: P2PQuakeMessage): msg is EewDetectionMessage => msg.code === 554;

export const isEew = (msg: P2PQuakeMessage): msg is EewMessage => msg.code === 556;

/**
 * P2PQuake は震源情報が存在しない場合、緯度経度に -200 を返す(公式仕様書に明記)。
 * 座標の妥当範囲チェックと合わせてこれを弾く。
 */
export const hasValidHypocenter = (
  hypocenter: Hypocenter | undefined
): hypocenter is Hypocenter =>
  hypocenter !== undefined &&
  hypocenter.latitude >= -90 &&
  hypocenter.latitude <= 90 &&
  hypocenter.longitude >= -180 &&
  hypocenter.longitude <= 180;

/** REST/WebSocket 両方から来る unknown な JSON を安全に P2PQuakeMessage へ絞り込む */
export const parseP2PQuakeMessage = (raw: unknown): P2PQuakeMessage | null => {
  if (typeof raw !== "object" || raw === null || !("code" in raw)) return null;
  const code = (raw as { code: unknown }).code;
  if (typeof code === "number" && KNOWN_CODES.has(code)) {
    return raw as P2PQuakeMessage;
  }
  return null;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test src/lib/p2pquake/guards.test.ts`
Expected: PASS (all cases green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/p2pquake/guards.ts src/lib/p2pquake/guards.test.ts
git commit -m "feat(p2pquake): add discriminated-union type guards and safe message parsing"
```

---

### Task 4: REST client with timeout + retry

**Files:**
- Create: `src/lib/p2pquake/rest.ts`

**Interfaces:**
- Consumes: `parseP2PQuakeMessage` from Task 3.
- Produces: `fetchHistory(options?: { codes?: number[]; limit?: number; timeoutMs?: number; retries?: number
  }): Promise<P2PQuakeMessage[]>`, `class P2PQuakeFetchError extends Error`. Used by Task 5 (API route).

- [ ] **Step 1: Implement `src/lib/p2pquake/rest.ts`**

```ts
import type { P2PQuakeMessage } from "@/types";
import { parseP2PQuakeMessage } from "./guards";

const HISTORY_URL = "https://api.p2pquake.net/v2/history";
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_RETRIES = 2;

export class P2PQuakeFetchError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "P2PQuakeFetchError";
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface FetchHistoryOptions {
  codes?: number[];
  limit?: number;
  timeoutMs?: number;
  retries?: number;
}

export const fetchHistory = async ({
  codes = [551, 552, 554, 556],
  limit = 30,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retries = DEFAULT_RETRIES,
}: FetchHistoryOptions = {}): Promise<P2PQuakeMessage[]> => {
  const url = `${HISTORY_URL}?codes=${codes.join(",")}&limit=${limit}`;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
      if (!res.ok) {
        throw new P2PQuakeFetchError(`P2PQuake responded with HTTP ${res.status}`);
      }
      const body: unknown = await res.json();
      if (!Array.isArray(body)) {
        throw new P2PQuakeFetchError("P2PQuake response body was not an array");
      }
      return body
        .map(parseP2PQuakeMessage)
        .filter((msg): msg is P2PQuakeMessage => msg !== null);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(2 ** attempt * 500);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new P2PQuakeFetchError("Failed to fetch P2PQuake history after retries", lastError);
};
```

- [ ] **Step 2: Type-check**

Run: `bunx tsc --noEmit`
Expected: no new errors originating from `src/lib/p2pquake/rest.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/p2pquake/rest.ts
git commit -m "feat(p2pquake): add REST history client with AbortController timeout and exponential-backoff retry"
```

---

### Task 5: Rewrite `/api/earthquakes` route

**Files:**
- Modify: `src/app/api/earthquakes/route.ts` (full replacement)
- Test: `src/app/api/earthquakes/route.test.ts`

**Interfaces:**
- Consumes: `fetchHistory`, `P2PQuakeFetchError` from Task 4.
- Produces: `GET(): Promise<NextResponse>` — consumed by the browser via `fetch("/api/earthquakes")` in Task 7.

- [ ] **Step 1: Write the failing test**

```ts
// src/app/api/earthquakes/route.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/app/api/earthquakes/route.test.ts`
Expected: FAIL — current `route.ts` has no error handling and calls `/history` without codes 552/554/556.

- [ ] **Step 3: Replace `src/app/api/earthquakes/route.ts`**

```ts
import { NextResponse } from "next/server";
import { fetchHistory, P2PQuakeFetchError } from "@/lib/p2pquake/rest";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const messages = await fetchHistory();
    return NextResponse.json(messages, {
      headers: {
        "Cache-Control": "public, max-age=3, stale-while-revalidate=10",
      },
    });
  } catch (error) {
    const cause = error instanceof P2PQuakeFetchError ? error.cause : undefined;
    console.error("[api/earthquakes] upstream fetch failed", error, cause);
    return NextResponse.json(
      { error: "地震情報の取得に失敗しました。しばらくしてから再度お試しください。" },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test src/app/api/earthquakes/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/earthquakes/route.ts src/app/api/earthquakes/route.test.ts
git commit -m "fix(api): add timeout/retry/caching to /api/earthquakes and cover all four P2PQuake codes"
```

---

### Task 6: WebSocket connection manager (reconnect + backoff + degrade)

**Files:**
- Create: `src/lib/p2pquake/socket.ts`
- Test: `src/lib/p2pquake/socket.test.ts`

**Interfaces:**
- Consumes: `parseP2PQuakeMessage` from Task 3.
- Produces: `type SocketStatus = "connecting" | "live" | "degraded" | "closed"`,
  `createP2PQuakeSocket(handlers: { onMessage: (message: P2PQuakeMessage) => void; onStatusChange: (status:
  SocketStatus) => void }): { close(): void }`. Used by Task 7 (hook).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/p2pquake/socket.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createP2PQuakeSocket } from "./socket";

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }

  close() {
    this.onclose?.();
  }

  emitOpen() {
    this.onopen?.();
  }

  emitMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  emitClose() {
    this.onclose?.();
  }
}

describe("createP2PQuakeSocket", () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);
    vi.useFakeTimers();
  });

  it("reports 'live' once connected and forwards parsed messages", () => {
    const onMessage = vi.fn();
    const onStatusChange = vi.fn();
    createP2PQuakeSocket({ onMessage, onStatusChange });

    const socket = FakeWebSocket.instances[0];
    socket.emitOpen();
    expect(onStatusChange).toHaveBeenCalledWith("live");

    socket.emitMessage({ id: "1", time: "t", code: 551, earthquake: { time: "t", maxScale: 10 }, points: [] });
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ code: 551 }));
  });

  it("ignores unparseable frames instead of throwing", () => {
    const onMessage = vi.fn();
    createP2PQuakeSocket({ onMessage, onStatusChange: vi.fn() });
    const socket = FakeWebSocket.instances[0];
    // emitMessage() JSON.stringify's its input, so a genuinely malformed frame must be
    // delivered by calling onmessage directly with a non-JSON string payload.
    expect(() => socket.onmessage?.({ data: "not json { at all" })).not.toThrow();
    expect(onMessage).not.toHaveBeenCalled();
  });

  it("reconnects with backoff after a close, and degrades after repeated failures", () => {
    const onStatusChange = vi.fn();
    createP2PQuakeSocket({ onMessage: vi.fn(), onStatusChange });

    for (let i = 0; i < 6; i++) {
      const socket = FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
      socket.emitClose();
      vi.runOnlyPendingTimers();
    }

    expect(onStatusChange).toHaveBeenCalledWith("degraded");
  });

  it("stops reconnecting once the caller calls close()", () => {
    const onStatusChange = vi.fn();
    const controller = createP2PQuakeSocket({ onMessage: vi.fn(), onStatusChange });
    controller.close();
    expect(onStatusChange).toHaveBeenLastCalledWith("closed");

    const countBefore = FakeWebSocket.instances.length;
    vi.runAllTimers();
    expect(FakeWebSocket.instances.length).toBe(countBefore);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/lib/p2pquake/socket.test.ts`
Expected: FAIL — `./socket` does not exist yet.

- [ ] **Step 3: Implement `src/lib/p2pquake/socket.ts`**

```ts
import type { P2PQuakeMessage } from "@/types";
import { parseP2PQuakeMessage } from "./guards";

const WS_URL = "wss://api.p2pquake.net/v2/ws";
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const DEGRADE_AFTER_ATTEMPTS = 5;

export type SocketStatus = "connecting" | "live" | "degraded" | "closed";

interface P2PQuakeSocketHandlers {
  onMessage: (message: P2PQuakeMessage) => void;
  onStatusChange: (status: SocketStatus) => void;
}

export const createP2PQuakeSocket = (handlers: P2PQuakeSocketHandlers): { close: () => void } => {
  let ws: WebSocket | null = null;
  let attempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closedByCaller = false;

  const scheduleReconnect = () => {
    if (closedByCaller) return;
    attempt += 1;
    handlers.onStatusChange(attempt > DEGRADE_AFTER_ATTEMPTS ? "degraded" : "connecting");
    const backoff = Math.min(INITIAL_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS);
    const jitter = backoff * (0.8 + Math.random() * 0.4);
    reconnectTimer = setTimeout(connect, jitter);
  };

  function connect() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      attempt = 0;
      handlers.onStatusChange("live");
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const parsed: unknown = JSON.parse(String(event.data));
        const message = parseP2PQuakeMessage(parsed);
        if (message) handlers.onMessage(message);
      } catch {
        // P2PQuake 側の一時的な不正フレームは無視して接続を維持する
      }
    };

    ws.onerror = () => {
      ws?.close();
    };

    ws.onclose = () => {
      if (!closedByCaller) scheduleReconnect();
    };
  }

  connect();

  return {
    close: () => {
      closedByCaller = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
      handlers.onStatusChange("closed");
    },
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test src/lib/p2pquake/socket.test.ts`
Expected: PASS (all four cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/p2pquake/socket.ts src/lib/p2pquake/socket.test.ts
git commit -m "feat(p2pquake): add WebSocket connection manager with backoff reconnect and degraded-mode signaling"
```

---

### Task 7: `useEarthquakeFeed` hook (WS + REST fallback, dedup, merge)

**Files:**
- Create: `src/hooks/useEarthquakeFeed.ts`

**Interfaces:**
- Consumes: `createP2PQuakeSocket`, `SocketStatus` (Task 6); `isJMAQuake`, `isJMATsunami`, `isEew` (Task 3);
  `P2PQuakeMessage`, `JMAQuakeMessage`, `EewMessage`, `JMATsunamiMessage` (Task 2).
- Produces:
  ```ts
  interface EarthquakeFeedState {
    quakes: JMAQuakeMessage[];
    latestEew: EewMessage | null;
    latestTsunami: JMATsunamiMessage | null;
    status: SocketStatus;
  }
  function useEarthquakeFeed(): EarthquakeFeedState & { dismissEew: () => void }
  ```
  Consumed by Task 8 (context provider).

- [ ] **Step 1: Implement `src/hooks/useEarthquakeFeed.ts`**

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { P2PQuakeMessage, JMAQuakeMessage, EewMessage, JMATsunamiMessage } from "@/types";
import { isJMAQuake, isEew, isJMATsunami, parseP2PQuakeMessage } from "@/lib/p2pquake/guards";
import { createP2PQuakeSocket, type SocketStatus } from "@/lib/p2pquake/socket";

const FALLBACK_POLL_INTERVAL_MS = 5000;
const MAX_QUAKES_RETAINED = 50;

export interface EarthquakeFeedState {
  quakes: JMAQuakeMessage[];
  latestEew: EewMessage | null;
  latestTsunami: JMATsunamiMessage | null;
  status: SocketStatus;
}

const initialState: EarthquakeFeedState = {
  quakes: [],
  latestEew: null,
  latestTsunami: null,
  status: "connecting",
};

/** 1件のメッセージを現在の状態にマージする(id で重複排除、最新順を維持) */
const mergeMessage = (
  state: EarthquakeFeedState,
  message: P2PQuakeMessage
): EarthquakeFeedState => {
  if (isJMAQuake(message)) {
    if (state.quakes.some((quake) => quake.id === message.id)) return state;
    return { ...state, quakes: [message, ...state.quakes].slice(0, MAX_QUAKES_RETAINED) };
  }
  if (isEew(message)) {
    return { ...state, latestEew: message.cancelled ? null : message };
  }
  if (isJMATsunami(message)) {
    return { ...state, latestTsunami: message.cancelled ? null : message };
  }
  return state; // code 554 (EEW検出) は状態を持たない通知トリガーのため無視する
};

export const useEarthquakeFeed = (): EarthquakeFeedState & { dismissEew: () => void } => {
  const [state, setState] = useState<EarthquakeFeedState>(initialState);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadInitial = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/earthquakes", { signal });
      if (!res.ok) return;
      const rawMessages: unknown[] = await res.json();
      const messages = rawMessages
        .map(parseP2PQuakeMessage)
        .filter((msg): msg is P2PQuakeMessage => msg !== null);

      setState((prev) => {
        let next = prev;
        // API は新しい順で返すため、prepend 型の mergeMessage で正しい順序になるよう古い順に処理する
        for (const message of [...messages].reverse()) {
          next = mergeMessage(next, message);
        }
        return next;
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("[useEarthquakeFeed] initial load failed", error);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadInitial(controller.signal);

    const socket = createP2PQuakeSocket({
      onMessage: (message) => setState((prev) => mergeMessage(prev, message)),
      onStatusChange: (status) => setState((prev) => ({ ...prev, status })),
    });

    return () => {
      controller.abort();
      socket.close();
    };
  }, [loadInitial]);

  useEffect(() => {
    if (state.status === "degraded") {
      pollTimerRef.current = setInterval(() => loadInitial(), FALLBACK_POLL_INTERVAL_MS);
    } else if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [state.status, loadInitial]);

  const dismissEew = useCallback(() => {
    setState((prev) => ({ ...prev, latestEew: null }));
  }, []);

  return { ...state, dismissEew };
};
```

- [ ] **Step 2: Type-check**

Run: `bunx tsc --noEmit`
Expected: no errors from `src/hooks/useEarthquakeFeed.ts` itself (errors in components not yet migrated are
expected and fixed in later tasks).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useEarthquakeFeed.ts
git commit -m "feat(p2pquake): add useEarthquakeFeed hook combining direct WebSocket with REST fallback"
```

---

### Task 8: `EarthquakeFeedProvider` context

**Files:**
- Create: `src/contexts/EarthquakeFeedProvider.tsx`

**Interfaces:**
- Consumes: `useEarthquakeFeed`, `EarthquakeFeedState` from Task 7.
- Produces: `EarthquakeFeedProvider({ children }: { children: ReactNode })`,
  `useEarthquakeFeedContext(): EarthquakeFeedState & { dismissEew: () => void }`. Used by Task 11 (page),
  Task 12 (sidebar), Task 13 (mapdata).

- [ ] **Step 1: Implement `src/contexts/EarthquakeFeedProvider.tsx`**

```tsx
"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useEarthquakeFeed, type EarthquakeFeedState } from "@/hooks/useEarthquakeFeed";

type EarthquakeFeedContextValue = EarthquakeFeedState & { dismissEew: () => void };

const EarthquakeFeedContext = createContext<EarthquakeFeedContextValue | null>(null);

export function EarthquakeFeedProvider({ children }: { children: ReactNode }) {
  const feed = useEarthquakeFeed();
  return (
    <EarthquakeFeedContext.Provider value={feed}>{children}</EarthquakeFeedContext.Provider>
  );
}

export function useEarthquakeFeedContext(): EarthquakeFeedContextValue {
  const context = useContext(EarthquakeFeedContext);
  if (!context) {
    throw new Error("useEarthquakeFeedContext must be used within EarthquakeFeedProvider");
  }
  return context;
}
```

- [ ] **Step 2: Type-check**

Run: `bunx tsc --noEmit`
Expected: no errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/contexts/EarthquakeFeedProvider.tsx
git commit -m "feat(p2pquake): add EarthquakeFeedProvider so Sidebar and Map share one live data source"
```

---

### Task 9: Fix `utils/index.ts` — including a real intensity-mislabeling bug

**Files:**
- Modify: `src/utils/index.ts` (full replacement)
- Test: `src/utils/index.test.ts`

**Interfaces:**
- Consumes: `JMAQuakeMessage`, `EarthquakeData` (Task 2).
- Produces: `normalize`, `convertMaxScaleToText`, `getColorByIntensity`, `convertToCardData`. Used by
  Task 12 (sidebar), Task 13 (mapdata).

**Why this matters:** the current `convertMaxScaleToText` maps `{50: "震度5弱", 55: "震度5強", 60: "震度6弱",
65: "震度6強", 70: "震度7"}`. The official `maxScale` enum (verified against P2PQuake's OpenAPI spec) is
`{45: 震度5弱, 50: 震度5強, 55: 震度6弱, 60: 震度6強, 70: 震度7}` — there is no `65` value at all. This means
production has been **displaying the wrong intensity label** for every 震度5弱 (shown as blank/undefined) and
every 震度5強+ quake (each shown one notch too low) since this function was written. `constants/index.ts`'s
`shindoIconMap`/`shindoColorMap` already use the correct keys, which is how this discrepancy was caught.

- [ ] **Step 1: Write the failing test**

```ts
// src/utils/index.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/utils/index.test.ts`
Expected: FAIL — current implementation returns `undefined` for `convertMaxScaleToText(45)` and
`"震度5弱"` (wrong) for `convertMaxScaleToText(50)`, and `convertToCardData` still expects the old
`ApiEarthquakeEntry` shape.

- [ ] **Step 3: Replace `src/utils/index.ts`**

```ts
import type { JMAQuakeMessage, EarthquakeData } from "@/types";

/** 文字列から空白文字(全角・半角)を削除して正規化 */
export const normalize = (s: string): string => s.replace(/\s|　/g, "").trim();

/** 気象庁 maxScale の公式enum(-1,10,20,30,40,45,50,55,60,70)に対応する震度テキスト */
const maxScaleTextMap: Record<number, string> = {
  10: "震度1",
  20: "震度2",
  30: "震度3",
  40: "震度4",
  45: "震度5弱",
  50: "震度5強",
  55: "震度6弱",
  60: "震度6強",
  70: "震度7",
};

export const convertMaxScaleToText = (scale: number): string | undefined => maxScaleTextMap[scale];

export const getColorByIntensity = (intensity?: string): string => {
  if (!intensity) return "bg-gray-300";
  if (intensity.includes("震度1")) return "bg-green-100";
  if (intensity.includes("震度2")) return "bg-yellow-100";
  if (intensity.includes("震度3")) return "bg-yellow-200";
  if (intensity.includes("震度4")) return "bg-orange-200";
  if (intensity.includes("震度5弱")) return "bg-orange-300";
  if (intensity.includes("震度5強")) return "bg-red-300";
  if (intensity.includes("震度6弱")) return "bg-red-400";
  if (intensity.includes("震度6強")) return "bg-red-500";
  if (intensity.includes("震度7")) return "bg-red-600";
  return "bg-gray-300";
};

export const convertToCardData = (message: JMAQuakeMessage): EarthquakeData => ({
  id: message.id,
  date: message.earthquake.time,
  location: message.earthquake.hypocenter?.name ?? "不明",
  magnitude: message.earthquake.hypocenter?.magnitude ?? 0,
  depth: message.earthquake.hypocenter?.depth ?? 0,
  intensity: convertMaxScaleToText(message.earthquake.maxScale),
  tsunami:
    message.earthquake.domesticTsunami === "Warning" ||
    message.earthquake.domesticTsunami === "Watch",
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test src/utils/index.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/index.ts src/utils/index.test.ts
git commit -m "fix(utils): correct maxScale-to-intensity-text mapping (was off by one severity notch)"
```

---

### Task 10: EEW / tsunami alert components + connection status

**Files:**
- Create: `src/components/EewBanner.tsx`
- Create: `src/components/TsunamiBanner.tsx`
- Create: `src/components/AlertBanners.tsx`
- Create: `src/components/ConnectionStatus.tsx`
- Test: `src/components/EewBanner.test.tsx`

**Interfaces:**
- Consumes: `EewMessage`, `JMATsunamiMessage` (Task 2), `convertMaxScaleToText` (Task 9),
  `SocketStatus` (Task 6).
- Produces: `AlertBanners({ eew, tsunami, onDismissEew })`, `ConnectionStatus({ status })`. Used by Task 12
  (sidebar).

- [ ] **Step 1: Write the failing test for `EewBanner`**

```tsx
// @vitest-environment jsdom
// src/components/EewBanner.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EewBanner from "./EewBanner";
import type { EewMessage } from "@/types";

const baseEew: EewMessage = {
  id: "1",
  time: "2026/01/01 00:00:00",
  code: 556,
  cancelled: false,
  earthquake: {
    originTime: "2026/01/01 00:00:00",
    arrivalTime: "2026/01/01 00:00:10",
    hypocenter: {
      name: "宗谷地方北部",
      latitude: 44.9,
      longitude: 142.1,
      depth: 10,
      magnitude: 5.5,
    },
  },
  issue: { time: "2026/01/01 00:00:24", eventId: "e1", serial: "1" },
  areas: [{ pref: "北海道道北", name: "上川地方北部", scaleFrom: 45, scaleTo: 45 }],
};

describe("EewBanner", () => {
  it("renders nothing when there is no active alert", () => {
    const { container } = render(<EewBanner eew={null} onDismiss={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders hypocenter, predicted intensity, and an explicit unofficial-source disclaimer", () => {
    render(<EewBanner eew={baseEew} onDismiss={vi.fn()} />);
    expect(screen.getByText(/宗谷地方北部/)).toBeInTheDocument();
    expect(screen.getByText(/震度5弱/)).toBeInTheDocument();
    expect(screen.getByText(/代替ではありません/)).toBeInTheDocument();
  });

  it("renders '7程度以上' for the scaleTo=99 sentinel instead of an unknown-scale label", () => {
    const overflow: EewMessage = {
      ...baseEew,
      areas: [{ pref: "北海道道北", name: "上川地方北部", scaleFrom: 70, scaleTo: 99 }],
    };
    render(<EewBanner eew={overflow} onDismiss={vi.fn()} />);
    expect(screen.getByText(/7程度以上/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/components/EewBanner.test.tsx`
Expected: FAIL — `./EewBanner` does not exist yet.

- [ ] **Step 3: Implement `src/components/EewBanner.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import type { EewMessage } from "@/types";
import { convertMaxScaleToText } from "@/utils";

const AUTO_DISMISS_MS = 3 * 60 * 1000;

const scaleToLabel = (scaleTo: number): string => {
  if (scaleTo === 99) return "震度7程度以上";
  return convertMaxScaleToText(scaleTo) ?? "不明";
};

export default function EewBanner({
  eew,
  onDismiss,
}: {
  eew: EewMessage | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!eew) return;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [eew, onDismiss]);

  if (!eew || !eew.earthquake) return null;

  const { hypocenter, originTime } = eew.earthquake;
  const maxScaleTo = eew.areas.reduce((max, area) => Math.max(max, area.scaleTo), -1);

  return (
    <div role="alert" className="bg-red-700 text-white px-4 py-3 shadow-lg">
      <div className="font-bold text-lg">緊急地震速報(速報値・未確定)</div>
      <div className="text-sm">
        {hypocenter?.name ?? "震源調査中"} M{hypocenter?.magnitude ?? "―"} 想定最大震度{" "}
        {maxScaleTo >= 0 ? scaleToLabel(maxScaleTo) : "不明"}
      </div>
      <div className="text-xs opacity-80">
        発生: {new Date(originTime).toLocaleTimeString("ja-JP")} ／
        この情報は気象庁の緊急地震速報の代替ではありません(P2P地震情報提供・品質無保証)
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test src/components/EewBanner.test.tsx`
Expected: PASS.

- [ ] **Step 5: Implement `src/components/TsunamiBanner.tsx`** (no test — trivial rendering, covered
  indirectly by `AlertBanners` wiring)

```tsx
import type { JMATsunamiMessage } from "@/types";

const gradeLabel: Record<string, string> = {
  MajorWarning: "大津波警報",
  Warning: "津波警報",
  Watch: "津波注意報",
  Unknown: "津波予報",
};

export default function TsunamiBanner({ tsunami }: { tsunami: JMATsunamiMessage | null }) {
  if (!tsunami || tsunami.cancelled || tsunami.areas.length === 0) return null;

  return (
    <div role="alert" className="bg-blue-800 text-white px-4 py-3 shadow-lg">
      <div className="font-bold text-lg">津波予報</div>
      <ul className="text-sm space-y-0.5">
        {tsunami.areas.map((area) => (
          <li key={area.name}>
            {area.name}: {gradeLabel[area.grade] ?? area.grade}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 6: Implement `src/components/AlertBanners.tsx`**

```tsx
"use client";

import EewBanner from "./EewBanner";
import TsunamiBanner from "./TsunamiBanner";
import type { EewMessage, JMATsunamiMessage } from "@/types";

export default function AlertBanners({
  eew,
  tsunami,
  onDismissEew,
}: {
  eew: EewMessage | null;
  tsunami: JMATsunamiMessage | null;
  onDismissEew: () => void;
}) {
  if (!eew && !tsunami) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[1000] flex flex-col">
      <EewBanner eew={eew} onDismiss={onDismissEew} />
      <TsunamiBanner tsunami={tsunami} />
    </div>
  );
}
```

- [ ] **Step 7: Implement `src/components/ConnectionStatus.tsx`**

```tsx
import type { SocketStatus } from "@/lib/p2pquake/socket";

const statusLabel: Record<SocketStatus, string> = {
  connecting: "接続中...",
  live: "リアルタイム受信中",
  degraded: "簡易更新モード(再接続中)",
  closed: "切断",
};

const statusColor: Record<SocketStatus, string> = {
  connecting: "bg-yellow-500",
  live: "bg-green-500",
  degraded: "bg-orange-500",
  closed: "bg-gray-500",
};

export default function ConnectionStatus({ status }: { status: SocketStatus }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-300 px-4 py-2">
      <span className={`inline-block w-2 h-2 rounded-full ${statusColor[status]}`} />
      {statusLabel[status]}
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/EewBanner.tsx src/components/EewBanner.test.tsx src/components/TsunamiBanner.tsx src/components/AlertBanners.tsx src/components/ConnectionStatus.tsx
git commit -m "feat(ui): add EEW/tsunami alert banners and a live-connection status indicator"
```

---

### Task 11: Rewrite `sidebar.tsx` to consume the shared feed context

**Files:**
- Modify: `src/components/sidebar.tsx` (full replacement)

**Interfaces:**
- Consumes: `useEarthquakeFeedContext` (Task 8), `convertToCardData` (Task 9), `AlertBanners`,
  `ConnectionStatus` (Task 10).

**Why:** removes the component's own independent 30-second `fetch`/`setInterval` loop (duplicate networking)
and the empty `catch` block that wiped the visible list on any transient network error.

- [ ] **Step 1: Replace `src/components/sidebar.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import Earthquake from "./earthquake";
import AlertBanners from "./AlertBanners";
import ConnectionStatus from "./ConnectionStatus";
import { useEarthquakeFeedContext } from "@/contexts/EarthquakeFeedProvider";
import { convertToCardData } from "@/utils";

export default function Sidebar({ children }: { children: ReactNode }) {
  const { quakes, latestEew, latestTsunami, status, dismissEew } = useEarthquakeFeedContext();
  const cards = quakes.map(convertToCardData);

  return (
    <div className="flex">
      <AlertBanners eew={latestEew} tsunami={latestTsunami} onDismissEew={dismissEew} />
      <aside className="w-64 h-screen bg-gray-800 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-gray-700">EarthRadar</div>
        <ConnectionStatus status={status} />
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {cards.map((card) => (
            <Earthquake key={card.id} data={card} />
          ))}
        </nav>
        <footer className="p-4 border-t border-gray-700 text-sm text-gray-400">
          &copy; 2026 EarthRadar
        </footer>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `bunx tsc --noEmit`
Expected: no errors from `sidebar.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/sidebar.tsx
git commit -m "refactor(sidebar): consume shared EarthquakeFeedProvider instead of its own polling loop"
```

---

### Task 12: Rewrite `mapdata.tsx` — remove polling, fix O(n²) style lookup, memoize icons

**Files:**
- Modify: `src/components/mapdata.tsx` (full replacement)

**Interfaces:**
- Consumes: `useEarthquakeFeedContext` (Task 8), `hasValidHypocenter` (Task 3), `normalize` (Task 9).

**Why:**
- Removes the component's own independent 10-second `fetch`/`setInterval` loop (now redundant with the
  shared context) and the missing `try/catch`/`AbortController` that could let a slow response race a newer
  one into stale state.
- Replaces `geoData.features.findIndex(f => JSON.stringify(f.properties) === JSON.stringify(feature.properties))`
  (an O(n²) stringify-compare run on every polygon, every render) with a `Map<Feature, number>` built once
  from feature *object identity* — react-leaflet's `GeoJSON` style callback always receives the exact same
  feature object reference that appears in the `data.features` array it was given, so identity comparison is
  both correct and O(1).
- Replaces the per-fetch `stations.find(...)` / `AreaName.findIndex(...)` linear scans with `Map`s built once
  via `useMemo`.
- Memoizes shindo marker icons (previously re-constructed via `L.icon()` on every render).

- [ ] **Step 1: Replace `src/components/mapdata.tsx`**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, GeoJSON, Marker, useMap } from "react-leaflet";
import L, { type StyleFunction } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from "geojson";

import { AreaName, AreaCode } from "./JMAPoints";
import type { JMAStation } from "@/types";
import { hasValidHypocenter } from "@/lib/p2pquake/guards";
import { normalize } from "@/utils";
import { useEarthquakeFeedContext } from "@/contexts/EarthquakeFeedProvider";
import {
  shindoColorMap,
  shindoIconMap,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
} from "@/constants";

const FlyToEpicenter = ({ lat, lon }: { lat: number; lon: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 7, { duration: 1.5 });
  }, [lat, lon, map]);
  return null;
};

const DEFAULT_ICON_OPTIONS = { iconSize: [24, 24] as [number, number], iconAnchor: [12, 12] as [number, number], popupAnchor: [0, -20] as [number, number] };

export default function MapData() {
  const [geoData, setGeoData] = useState<FeatureCollection<Geometry, GeoJsonProperties> | null>(null);
  const [stations, setStations] = useState<JMAStation[]>([]);
  const { quakes } = useEarthquakeFeedContext();

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

  const filledMap = useMemo(() => {
    const result: Record<number, number> = {};
    if (!latestQuake) return result;
    for (const point of latestQuake.points) {
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
  }, [latestQuake, stationByNormalizedName, areaCodeByNormalizedAreaName]);

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
    <div className="w-full h-screen bg-[#1d1d1d]">
      <MapContainer
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_MAP_ZOOM}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        {geoData && <GeoJSON data={geoData} style={polygonStyle} />}
        {latestQuake?.earthquake.hypocenter && (
          <>
            <FlyToEpicenter
              lat={latestQuake.earthquake.hypocenter.latitude}
              lon={latestQuake.earthquake.hypocenter.longitude}
            />
            <Marker
              position={[
                latestQuake.earthquake.hypocenter.latitude,
                latestQuake.earthquake.hypocenter.longitude,
              ]}
              icon={epicenterIcon}
            />
            {latestQuake.points.map((point, i) => {
              if (point.isArea) return null;
              const station = stationByNormalizedName.get(normalize(point.addr));
              if (!station) return null;
              return (
                <Marker
                  key={`pt-${i}`}
                  position={[station.lat, station.lon]}
                  icon={getShindoIcon(point.scale)}
                />
              );
            })}
          </>
        )}
      </MapContainer>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `bunx tsc --noEmit`
Expected: no errors from `mapdata.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/mapdata.tsx
git commit -m "perf(map): replace O(n^2) JSON.stringify feature matching and linear station scans with memoized Maps"
```

---

### Task 13: Wire the provider into the page, and low-priority cosmetic fixes

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `EarthquakeFeedProvider` (Task 8).

- [ ] **Step 1: Replace `src/app/page.tsx`**

```tsx
import Sidebar from "@/components/sidebar";
import Map from "@/components/map";
import { EarthquakeFeedProvider } from "@/contexts/EarthquakeFeedProvider";

export default function Home() {
  return (
    <EarthquakeFeedProvider>
      <Sidebar>
        <Map />
      </Sidebar>
    </EarthquakeFeedProvider>
  );
}
```

- [ ] **Step 2: Fix branding typo and template-literal nit in `src/app/layout.tsx`**

Change:
```tsx
export const metadata: Metadata = {
  title: "earthrader",
  description: "Earthrader is a EarthQuake Monitoring System",
};
```
to:
```tsx
export const metadata: Metadata = {
  title: "EarthRadar",
  description: "EarthRadar is a real-time earthquake monitoring system",
};
```

Change:
```tsx
        className={`antialiased`}
```
to:
```tsx
        className="antialiased"
```

- [ ] **Step 3: Type-check and build**

Run: `bunx tsc --noEmit && bun run build`
Expected: both succeed with zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx
git commit -m "chore: wire EarthquakeFeedProvider into the page tree; fix EarthRadar branding typo"
```

---

### Task 14: Remove dead code from `JMAPoints.ts`

**Files:**
- Modify: `src/components/JMAPoints.ts`

**Why:** `JMAPoints` (a 41KB unused array), `AreaKana`, and `centerPoint` are exported but never imported
anywhere in the codebase (only `AreaName` and `AreaCode` are used, by `mapdata.tsx`). This is dead weight in
a file that ships to the client bundle.

- [ ] **Step 1: Verify current usage before deleting**

Run: `grep -rn "AreaKana\|centerPoint\|JMAPoints\b" src --include="*.ts*" | grep -v "src/components/JMAPoints.ts"`
Expected: no output (confirms these three exports are unused outside their own file).

- [ ] **Step 2: Trim the file to only `AreaCode` and `AreaName`**

```bash
python3 - <<'EOF'
path = "src/components/JMAPoints.ts"
with open(path, encoding="utf-8") as f:
    content = f.read()

start = content.index("export const AreaCode")
end = content.index("export const AreaKana")
trimmed = content[start:end].rstrip() + "\n"

with open(path, "w", encoding="utf-8") as f:
    f.write(trimmed)
EOF
```

- [ ] **Step 3: Confirm the file now only exports `AreaCode` and `AreaName`**

Run: `grep -n "export const" src/components/JMAPoints.ts`
Expected:
```
export const AreaCode
export const AreaName
```

- [ ] **Step 4: Type-check and build**

Run: `bunx tsc --noEmit && bun run build`
Expected: both succeed (only `AreaName`/`AreaCode` were ever imported, so nothing breaks).

- [ ] **Step 5: Commit**

```bash
git add src/components/JMAPoints.ts
git commit -m "chore: remove unused JMAPoints/AreaKana/centerPoint exports (41KB of dead weight in the client bundle)"
```

---

### Task 15: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `bun run test`
Expected: all tests pass (guards, rest/route integration, socket, utils, EewBanner).

- [ ] **Step 2: Run the type checker**

Run: `bunx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Run lint**

Run: `bun run lint`
Expected: zero errors/warnings. If `next lint` flags anything in files touched by this plan, fix it before
proceeding (do not add eslint-disable comments to silence real issues).

- [ ] **Step 4: Run the production build**

Run: `bun run build`
Expected: build succeeds with no type or bundling errors.

- [ ] **Step 5: Manual smoke test**

Run: `bun run dev`, open the app in a browser, open devtools Network tab, and confirm:
- A WebSocket connection to `wss://api.p2pquake.net/v2/ws` appears and stays open.
- The `ConnectionStatus` indicator shows "リアルタイム受信中" once the socket opens.
- `/api/earthquakes` is called exactly once on load (not every 10s/30s anymore).
- Sidebar and map show the same latest quake (no more inconsistency between the two).

- [ ] **Step 6: Commit any final fixups**

```bash
git add -A
git commit -m "chore: final verification fixups"
```

(Skip this commit if step 1-5 required no changes.)
