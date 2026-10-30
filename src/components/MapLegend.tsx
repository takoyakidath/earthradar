import { SEVERITY_LEVELS } from "@/constants";

export function MapLegend() {
  return (
    <div
      className="absolute bottom-3 left-3 z-(--z-map-control) rounded-lg border border-white/10 bg-black/55 px-3 py-2.5 text-white backdrop-blur-sm"
      aria-label="震度カラースケール凡例"
    >
      <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-white/70">震度</p>
      <div className="flex items-center gap-1">
        {SEVERITY_LEVELS.map((level) => (
          <div key={level.scale} className="flex flex-col items-center gap-1" title={level.label}>
            <span
              className="h-3.5 w-3.5 rounded-sm"
              style={{ backgroundColor: level.color }}
              aria-hidden
            />
            <span className="text-[9px] tabular-nums text-white/60">{level.short}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
