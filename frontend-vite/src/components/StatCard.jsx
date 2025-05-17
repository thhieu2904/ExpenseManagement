import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

const StatCard = ({ title, value, prevValue, icon: Icon, color = "blue" }) => {
  const compare = () => {
    if (prevValue === null || prevValue === undefined || prevValue === 0)
      return { change: "0%", up: true };
    const diff = value - prevValue;
    const percent = Math.round((diff / prevValue) * 100);
    return { change: `${Math.abs(percent)}%`, up: diff >= 0 };
  };

  const { change, up } = compare();

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 w-full sm:w-[32%] flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{title}</span>
        {Icon && <Icon size={22} className={`text-${color}-500`} />}
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-800">
        {value.toLocaleString()}đ
      </div>
      {prevValue !== null && (
        <div className="mt-1 text-sm flex items-center gap-1">
          {up ? (
            <ArrowUp size={14} className="text-green-600" />
          ) : (
            <ArrowDown size={14} className="text-red-600" />
          )}
          <span className={up ? "text-green-600" : "text-red-600"}>
            So với tháng trước: {change}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
