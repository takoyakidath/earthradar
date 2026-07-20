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
