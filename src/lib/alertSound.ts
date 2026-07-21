// EEW・津波の新着通知を音で知らせる。バナー表示だけだとバックグラウンドタブで気付けないため。

type AudioContextCtor = typeof AudioContext;

let ctx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
};

/** ブラウザの自動再生制限を避けるため、最初のユーザー操作で AudioContext を起こしておく */
export const initAlertSound = (): (() => void) => {
  if (typeof window === "undefined") return () => {};
  const resume = () => getAudioContext();
  window.addEventListener("pointerdown", resume, { once: true });
  window.addEventListener("keydown", resume, { once: true });
  return () => {
    window.removeEventListener("pointerdown", resume);
    window.removeEventListener("keydown", resume);
  };
};

const beep = (frequencies: number[], durationMs: number, gapMs: number) => {
  const audioCtx = getAudioContext();
  if (!audioCtx) return;
  let time = audioCtx.currentTime;
  for (const freq of frequencies) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.3, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + durationMs / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(time);
    osc.stop(time + durationMs / 1000 + 0.02);
    time += (durationMs + gapMs) / 1000;
  }
};

export const playEewAlertSound = (): void => beep([880, 880, 880], 150, 90);

export const playTsunamiAlertSound = (): void => beep([660, 440], 220, 120);

const EEW_ALARM_REPEAT_MS = 4000;
export const EEW_ALARM_DURATION_MS = 10 * 60 * 1000;

/** 震度5弱以上のEEWを想定した連続アラーム。最長10分で自動停止する。呼び出し側は返り値で早期停止できる */
export const startEewAlarmLoop = (): (() => void) => {
  playEewAlertSound();
  const interval = setInterval(playEewAlertSound, EEW_ALARM_REPEAT_MS);
  const timeout = setTimeout(() => clearInterval(interval), EEW_ALARM_DURATION_MS);
  return () => {
    clearInterval(interval);
    clearTimeout(timeout);
  };
};
