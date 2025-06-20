// frontend-vite/src/components/Categories/CategoryAnalysisChart.jsx

import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Sector,
} from "recharts";
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
  onActiveCategoryChange,
}) => {
  const [activeIndex, setActiveIndex] = useState(null);

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

  const handlePieClick = (data, index) => {
    const newIndex = activeIndex === index ? null : index;
    setActiveIndex(newIndex);
    if (onActiveCategoryChange) {
      onActiveCategoryChange(newIndex !== null ? data._id || data.id : null);
    }
  };

  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
      value,
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 20) * cos;
    const my = cy + (outerRadius + 20) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 12;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
      <g>
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          fill="#333"
          fontSize={16}
          fontWeight={600}
          style={{
            maxWidth: "120px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {payload.name}
        </text>
        <text
          x={cx}
          y={cy + 15}
          textAnchor="middle"
          fill={fill}
          fontSize={20}
          fontWeight={700}
        >
          {formatCurrency(value)}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke={fill}
          fill="none"
          opacity={0.7}
        />
        <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" opacity={0.7} />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 8}
          y={ey}
          dy={4}
          textAnchor={textAnchor}
          fill="#666"
          fontWeight={500}
        >
          {`(${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  };

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
          {activeIndex === null && (
            <div className={customChartStyles.centerLabel}>
              <span>Tổng cộng</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
          )}
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
                isAnimationActive={true}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onClick={handlePieClick}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    cursor="pointer"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [formatCurrency(value), name]}
                contentStyle={{
                  borderRadius: 12,
                  boxShadow: "0 2px 12px #0001",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CategoryAnalysisChart;
