import React from "react";

interface EarthquakeData {
  id: string;
  date: string; // ISO形式
  location: string;
  magnitude: number;
  depth: number; // km
  intensity?: string; // 例: "震度5強"
  tsunami: boolean;
}

// 震度→背景色マッピング
const getColorByIntensity = (intensity?: string): string => {
  if (!intensity) return "bg-gray-300"; // 情報なし

  if (intensity.includes("震度1")) return "bg-green-100";
  if (intensity.includes("震度2")) return "bg-yellow-100";
  if (intensity.includes("震度3")) return "bg-yellow-200";
  if (intensity.includes("震度4")) return "bg-orange-200";
  if (intensity.includes("震度5弱")) return "bg-orange-300";
  if (intensity.includes("震度5強")) return "bg-red-300";
  if (intensity.includes("震度6弱")) return "bg-red-400";
  if (intensity.includes("震度6強")) return "bg-red-500";
  if (intensity.includes("震度7")) return "bg-red-600";

  return "bg-gray-300"; // 該当しない場合
};

const Earthquake: React.FC<{ data: EarthquakeData }> = ({ data }) => {
  const formattedDate = new Date(data.date).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const bgColor = getColorByIntensity(data.intensity);

  return (
    <div className={`${bgColor} rounded-xl shadow-md p-4 border border-gray-200`}>
      <div className="text-sm text-gray-500 mb-1">{formattedDate}</div>
      <div className="text-lg font-semibold text-gray-800">{data.location}</div>
      <div className="mt-2 space-y-1 text-sm text-gray-700">
        <div>
          <span className="font-medium">マグニチュード:</span> M{data.magnitude}
        </div>
        <div>
          <span className="font-medium">深さ:</span> {data.depth}km
        </div>
        {data.intensity && (
          <div>
            <span className="font-medium">最大震度:</span> {data.intensity}
          </div>
        )}
        {data.tsunami && (
          <div>
            <span className="font-medium">津波:</span> あり
          </div>
        )}
      </div>
    </div>
  );
};

export default Earthquake;
