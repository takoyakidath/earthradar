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
