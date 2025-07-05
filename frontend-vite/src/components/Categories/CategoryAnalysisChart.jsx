// frontend-vite/src/components/Categories/CategoryAnalysisChart.jsx
import React, { useState } from "react";
import BasePieChart from "../Common/BasePieChart";
import DateRangeNavigator from "../Common/DateRangeNavigator";
import styles from "../DetailedAnalyticsSection/IncomeExpenseTrendChart.module.css";
import customChartStyles from "./CategoryAnalysisChart.module.css";

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

const CategoryAnalysisChart = ({
  data,
  total,
  loading,
  error,
  categoryType,
  period,
  currentDate,
  onPeriodChange,
  onDateChange,
  onActiveCategoryChange,
}) => {
  const [activeIndex, setActiveIndex] = useState(null);

  // Navigation handlers
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

  const getDateLabel = () => {
    if (period === "week") {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
    }
    if (period === "month") return `${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
    if (period === "year") return `Năm ${currentDate.getFullYear()}`;
    return "";
  };

  const chartTitle =
    categoryType === "THUNHAP"
      ? "Cơ cấu Thu nhập"
      : categoryType === "CHITIEU"
      ? "Cơ cấu Chi tiêu"
      : "Cơ cấu Thu chi";

  const handlePieClick = (sliceData, index) => {
    const newIndex = activeIndex === index ? null : index;
    setActiveIndex(newIndex);
    if (onActiveCategoryChange) {
      onActiveCategoryChange(newIndex !== null ? sliceData._id || sliceData.id : null);
    }
  };

  return (
    <div className={styles.chartContainer}>
      <div className={styles.headerContainer}>
        <div className={styles.controlsGroup}>
          <div className={styles.filterButtons}>
            <button
              onClick={() => onPeriodChange("week")}
              className={period === "week" ? styles.active : ""}
            >
              Tuần
            </button>
            <button
              onClick={() => onPeriodChange("month")}
              className={period === "month" ? styles.active : ""}
            >
              Tháng
            </button>
            <button
              onClick={() => onPeriodChange("year")}
              className={period === "year" ? styles.active : ""}
            >
              Năm
            </button>
          </div>

          <div className={styles.navButtonsBox}>
            <button onClick={handlePrev} aria-label="Kỳ trước">
              ‹
            </button>
            <div className={styles.navDateBox}>{getDateLabel()}</div>
            <button onClick={handleNext} aria-label="Kỳ sau">
              ›
            </button>
          </div>
        </div>
      </div>

      <div className={customChartStyles.chartTitle}>{chartTitle}</div>

      <BasePieChart
        title={`Phân tích ${categoryType === 'income' ? 'thu nhập' : 'chi tiêu'} theo danh mục`}
        data={data}
        total={total}
        loading={loading}
        error={error}
        onSliceClick={handlePieClick}
        colors={COLORS}
        showCenterLabel={true}
        showLabels={true}
        showTooltip={true}
        showActiveShape={true}
        detailsLink={{
          url: "/transactions",
          text: "Xem giao dịch",
          title: "Xem trang quản lý giao dịch"
        }}
        chartConfig={{
          innerRadius: 80,
          outerRadius: 120,
          paddingAngle: 2,
          height: 400,
        }}
        labelConfig={{
          fontSize: 13,
          activeFontSize: 15,
          fontWeight: 600,
          activeFontWeight: 700,
          labelRadius: 60,
          activeLabelRadius: 60,
        }}
      />
    </div>
  );
};

export default CategoryAnalysisChart;

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


