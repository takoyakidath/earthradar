import type { JMATsunamiMessage } from "@/types";
import { IconWaves } from "./ui/icons";

const gradeMeta: Record<string, { label: string; emphasis: boolean }> = {
  MajorWarning: { label: "大津波警報", emphasis: true },
  Warning: { label: "津波警報", emphasis: true },
  Watch: { label: "津波注意報", emphasis: false },
  Unknown: { label: "津波予報", emphasis: false },
};

export default function TsunamiBanner({ tsunami }: { tsunami: JMATsunamiMessage | null }) {
  if (!tsunami || tsunami.cancelled || tsunami.areas.length === 0) return null;

  const hasMajor = tsunami.areas.some((a) => gradeMeta[a.grade]?.emphasis);

  return (
    <div
      role="alert"
      className={`animate-slide-down border-b border-black/10 px-4 py-3 text-white ${
        hasMajor ? "bg-danger-strong" : "bg-brand-strong"
      }`}
    >
      <div className="mx-auto flex max-w-4xl items-start gap-3">
        <IconWaves className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-base font-bold tracking-tight">津波情報</div>
          <ul className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
            {tsunami.areas.map((area) => (
              <li key={area.name}>
                {area.name}: <span className="font-semibold">{gradeMeta[area.grade]?.label ?? area.grade}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
