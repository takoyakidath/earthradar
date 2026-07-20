import type { JMATsunamiMessage } from "@/types";

const gradeLabel: Record<string, string> = {
  MajorWarning: "大津波警報",
  Warning: "津波警報",
  Watch: "津波注意報",
  Unknown: "津波予報",
};

export default function TsunamiBanner({ tsunami }: { tsunami: JMATsunamiMessage | null }) {
  if (!tsunami || tsunami.cancelled || tsunami.areas.length === 0) return null;

  return (
    <div role="alert" className="bg-blue-800 text-white px-4 py-3 shadow-lg">
      <div className="font-bold text-lg">津波予報</div>
      <ul className="text-sm space-y-0.5">
        {tsunami.areas.map((area) => (
          <li key={area.name}>
            {area.name}: {gradeLabel[area.grade] ?? area.grade}
          </li>
        ))}
      </ul>
    </div>
  );
}
