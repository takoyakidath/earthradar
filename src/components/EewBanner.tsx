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
