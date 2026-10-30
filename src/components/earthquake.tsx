import React from "react";
import type { EarthquakeData } from "@/types";
import { getSeverityMeta, formatRelativeTime } from "@/utils";
import { SeverityBadge } from "./ui/badge";
import { IconWaves } from "./ui/icons";

const Earthquake: React.FC<{
  data: EarthquakeData;
  selected?: boolean;
  onSelect?: (id: string) => void;
}> = ({ data, selected = false, onSelect }) => {
  const severity = getSeverityMeta(data.intensity);
  const isMajor = severity.scale >= 45;

  const formattedDate = new Date(data.date).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <button
      type="button"
      onClick={() => onSelect?.(data.id)}
      aria-pressed={selected}
      className={`group w-full rounded-lg border p-3.5 text-left transition-all duration-150
        cursor-pointer
        ${
          selected
            ? "border-brand bg-brand-soft shadow-xs"
            : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover"
        }
        ${isMajor ? "ring-1 ring-danger/30" : ""}`}
    >
      <div className="flex items-start gap-3">
        <SeverityBadge
          label={severity.short}
          color={severity.color}
          foreground={severity.foreground}
          size={isMajor ? "lg" : "md"}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[13px] font-semibold text-text-primary">
              {data.location}
            </span>
            <time
              dateTime={data.date}
              className="shrink-0 text-[11px] tabular-nums text-text-tertiary"
              title={formattedDate}
            >
              {formatRelativeTime(data.date)}
            </time>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary tabular-nums">
            <span>
              M<span className="font-semibold text-text-primary">{data.magnitude || "―"}</span>
            </span>
            <span className="text-border-strong" aria-hidden>
              /
            </span>
            <span>
              深さ <span className="font-semibold text-text-primary">{data.depth}</span>km
            </span>
          </div>

          {data.tsunami && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand-strong">
              <IconWaves className="h-3.5 w-3.5" />
              津波の可能性あり
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default React.memo(Earthquake);
