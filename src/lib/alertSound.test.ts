import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

class FakeGain {
  gain = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
  connect = vi.fn(() => this);
}

class FakeOscillator {
  type = "";
  frequency = { value: 0 };
  start = vi.fn();
  stop = vi.fn();
  connect = vi.fn(() => this);
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: "running" | "suspended" = "suspended";
  currentTime = 0;
  destination = {};
  resume = vi.fn(() => {
    this.state = "running";
    return Promise.resolve();
  });
  createOscillator = vi.fn(() => new FakeOscillator());
  createGain = vi.fn(() => new FakeGain());

  constructor() {
    FakeAudioContext.instances.push(this);
  }
}

// alertSound はモジュールスコープで AudioContext をシングルトン保持するため、
// テスト間の汚染を避けるためにテストごとにモジュールを取り直す。
const loadAlertSound = async () => {
  vi.resetModules();
  FakeAudioContext.instances = [];
  vi.stubGlobal("AudioContext", FakeAudioContext as unknown as typeof AudioContext);
  return import("./alertSound");
};

describe("alertSound", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates oscillators when playing an EEW alert", async () => {
    const { playEewAlertSound } = await loadAlertSound();
    playEewAlertSound();
    const ctx = FakeAudioContext.instances[0];
    expect(ctx.createOscillator).toHaveBeenCalledTimes(3);
    expect(ctx.resume).toHaveBeenCalled();
  });

  it("creates oscillators when playing a tsunami alert", async () => {
    const { playTsunamiAlertSound } = await loadAlertSound();
    playTsunamiAlertSound();
    const ctx = FakeAudioContext.instances[0];
    expect(ctx.createOscillator).toHaveBeenCalledTimes(2);
  });

  it("reuses the same AudioContext across calls instead of creating a new one each time", async () => {
    const { playEewAlertSound, playTsunamiAlertSound } = await loadAlertSound();
    playEewAlertSound();
    playTsunamiAlertSound();
    expect(FakeAudioContext.instances.length).toBe(1);
  });

  it("resumes the AudioContext on first pointerdown so playback isn't blocked by autoplay policy", async () => {
    const { initAlertSound } = await loadAlertSound();
    const stop = initAlertSound();
    window.dispatchEvent(new Event("pointerdown"));
    const ctx = FakeAudioContext.instances[0];
    expect(ctx.resume).toHaveBeenCalled();
    stop();
  });

  describe("startEewAlarmLoop", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("plays immediately and repeats every 4s until manually stopped", async () => {
      const { startEewAlarmLoop } = await loadAlertSound();

      const stop = startEewAlarmLoop();
      const ctx = FakeAudioContext.instances[0];
      expect(ctx.createOscillator).toHaveBeenCalledTimes(3); // 即時1回分(3音)

      vi.advanceTimersByTime(4000);
      expect(ctx.createOscillator).toHaveBeenCalledTimes(6); // 4秒後にもう1回分

      stop();
      vi.advanceTimersByTime(20000);
      expect(ctx.createOscillator).toHaveBeenCalledTimes(6); // stop後は増えない
    });

    it("auto-stops after 10 minutes even without manual stop", async () => {
      const { startEewAlarmLoop } = await loadAlertSound();

      startEewAlarmLoop();
      const ctx = FakeAudioContext.instances[0];
      vi.advanceTimersByTime(10 * 60 * 1000 + 1);
      const callsAtTenMinutes = ctx.createOscillator.mock.calls.length;

      vi.advanceTimersByTime(8000);
      expect(ctx.createOscillator).toHaveBeenCalledTimes(callsAtTenMinutes);
    });
  });
});
