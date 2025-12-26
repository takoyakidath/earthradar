import React from "react";
import type { EarthquakeData } from "@/types";
import { getColorByIntensity } from "@/utils";

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
    <div className={`${bgColor} rounded-xl shadow-md p-4 border ${data.tsunami ? "border-blue-500" : "border-gray-200"}`}>
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
