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
    <div
      className="fixed inset-x-0 top-0 z-(--z-alert) flex flex-col"
      aria-live="assertive"
      aria-atomic="false"
    >
      <EewBanner eew={eew} onDismiss={onDismissEew} />
      <TsunamiBanner tsunami={tsunami} />
    </div>
  );
}
