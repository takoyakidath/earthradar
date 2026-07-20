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
