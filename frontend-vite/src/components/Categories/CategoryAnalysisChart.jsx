// frontend-vite/src/components/Categories/CategoryAnalysisChart.jsx

import React from "react"; // ✅ BỎ: useState, useEffect, useCallback, axios
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getIconObject } from "../../utils/iconMap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// Tái sử dụng style từ component biểu đồ của HomePage cho nhất quán
import styles from "../DetailedAnalyticsSection/IncomeExpenseTrendChart.module.css";
import customChartStyles from "./CategoryAnalysisChart.module.css"; // CSS riêng cho biểu đồ

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF4560",
  "#3366CC",
  "#DC3912",
  "#FF9900",
  "#109618",
  "#990099",
  "#0099C6",
];

const formatCurrency = (value) =>
  value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

// --- renderCustomizedLabel Component (Không thay đổi) ---
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  payload,
}) => {
  const RADIAN = Math.PI / 180;
  const labelRadius = outerRadius + 60;
  const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
  const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);
  const icon = getIconObject(payload.icon);

  if (percent < 0.01) {
    return null;
  }

  const iconSize = 20;
  const textOffset = 5;
  const isLeft = x < cx;

  return (
    <g textAnchor={isLeft ? "end" : "start"}>
      <path
        d={`M${cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN)},${
          cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN)
        } L${x},${y}`}
        stroke="#999"
        fill="none"
        strokeWidth={1}
      />
      <foreignObject
        x={isLeft ? x - iconSize : x}
        y={y - iconSize / 2}
        width={iconSize}
        height={iconSize}
      >
        <FontAwesomeIcon
          icon={icon}
          style={{ width: "100%", height: "100%", color: "#333" }}
        />
      </foreignObject>
      <text
        x={isLeft ? x - iconSize - textOffset : x + iconSize + textOffset}
        y={y}
        dominantBaseline="central"
        fill="#333"
        fontSize="13"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

// --- ✅ THAY ĐỔI 1: CẬP NHẬT PROPS VÀ LOẠI BỎ LOGIC FETCH ---
const CategoryAnalysisChart = ({
  // Props dữ liệu mới
  data,
  total,
  loading,
  error,
  // Props bộ lọc để hiển thị
  categoryType,
  period,
  currentDate,
  onPeriodChange,
  onDateChange,
}) => {
  // --- TOÀN BỘ LOGIC FETCH ĐÃ BỊ XÓA ---

  // --- CÁC HÀM ĐIỀU KHIỂN BỘ LỌC (Không đổi) ---
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (period === "week") newDate.setDate(newDate.getDate() - 7);
    if (period === "month") newDate.setMonth(newDate.getMonth() - 1);
    if (period === "year") newDate.setFullYear(newDate.getFullYear() - 1);
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (period === "week") newDate.setDate(newDate.getDate() + 7);
    if (period === "month") newDate.setMonth(newDate.getMonth() + 1);
    if (period === "year") newDate.setFullYear(newDate.getFullYear() + 1);
    onDateChange(newDate);
  };

  const getDisplayBox = () => {
    if (period === "week") {
      const endOfWeek = new Date(currentDate);
      endOfWeek.setDate(currentDate.getDate() + 6);
      return `${currentDate.toLocaleDateString(
        "vi-VN"
      )} - ${endOfWeek.toLocaleDateString("vi-VN")}`;
    }
    if (period === "month")
      return currentDate.toLocaleDateString("vi-VN", {
        month: "long",
        year: "numeric",
      });
    if (period === "year") return `Năm ${currentDate.getFullYear()}`;
    return "";
  };

  const chartTitle =
    categoryType === "THUNHAP"
      ? "Cơ cấu Thu nhập"
      : categoryType === "CHITIEU"
      ? "Cơ cấu Chi tiêu"
      : "Cơ cấu Thu chi";

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartTitle}>{chartTitle}</div>

      {/* ✅ THAY ĐỔI 2: PHẦN BIỂU ĐỒ RENDER DỰA TRÊN PROPS */}
      {loading && <p className={styles.loadingText}>Đang tải...</p>}
      {error && !loading && <p className={styles.errorText}>{error}</p>}
      {!loading && !error && data.length === 0 && (
        <p className={styles.noDataText}>Không có dữ liệu.</p>
      )}
      {!loading && !error && data.length > 0 && (
        <div style={{ position: "relative", width: "100%", height: 400 }}>
          <div className={customChartStyles.centerLabel}>
            <span>Tổng cộng</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={2}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                labelLine={false}
                label={renderCustomizedLabel}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CategoryAnalysisChart;
