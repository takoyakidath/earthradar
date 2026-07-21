"use client";

import { useEffect } from "react";
import type { EewMessage } from "@/types";
import { convertMaxScaleToText } from "@/utils";
import { IconAlertTriangle, IconClose } from "./ui/icons";

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
    <div
      role="alert"
      className="animate-slide-down border-b border-black/10 bg-danger px-4 py-3 text-white shadow-glow-danger"
    >
      <div className="mx-auto flex max-w-4xl items-start gap-3">
        <IconAlertTriangle className="mt-0.5 h-6 w-6 shrink-0 animate-pulse-soft" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-base font-bold tracking-tight">
            緊急地震速報
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide">
              速報値・未確定
            </span>
          </div>
          <div className="mt-0.5 text-sm tabular-nums">
            {hypocenter?.name ?? "震源調査中"} ・ M{hypocenter?.magnitude ?? "―"} ・ 想定最大
            {maxScaleTo >= 0 ? scaleToLabel(maxScaleTo) : "不明"}
          </div>
          <div className="mt-1 text-xs tabular-nums text-white/80">
            発生: {new Date(originTime).toLocaleTimeString("ja-JP")} ／
            この情報は気象庁の緊急地震速報の代替ではありません(P2P地震情報提供・品質無保証)
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="緊急地震速報を閉じる"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/80
            transition-colors duration-150 hover:bg-white/15 hover:text-white cursor-pointer"
        >
          <IconClose className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}
