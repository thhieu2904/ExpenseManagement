// GHI ĐÈ VÀO FILE: frontend-vite/src/components/DetailedAnalyticsSection/CategoryExpenseChart.jsx

import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Sector,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./CategoryExpenseChart.module.css";
import { getIconObject } from "../../utils/iconMap";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF4560",
  "#3366CC",
  "#DC3912",
];

const formatCurrency = (value) =>
  value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

// ✅ SỬA 1: Thêm tham số `isActive` để quyết định style nổi bật
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  payload,
  isActive, // Tham số mới
}) => {
  // Với yêu cầu mới, chúng ta sẽ luôn hiển thị nhãn của múi được chọn,
  // nên có thể bỏ qua điều kiện percent < 0.02 nếu múi đó đang active.
  if (!isActive && percent < 0.02) return null;

  // Style được điều chỉnh dựa trên `isActive`
  const labelRadius = isActive ? outerRadius + 45 : outerRadius + 35;
  const strokeWidth = isActive ? 2.2 : 1.5;
  const fontSize = isActive ? 15 : 13;
  const fontWeight = isActive ? 700 : 600;

  const RADIAN = Math.PI / 180;
  const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
  const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);
  const icon = getIconObject(payload.icon);
  const iconSize = 20;
  const textOffset = 5;
  const isLeft = x < cx;

  return (
    <g textAnchor={isLeft ? "end" : "start"} fill={payload.fill}>
      <path
        d={`M${cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN)},${
          cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN)
        } L${x},${y}`}
        stroke={payload.fill}
        fill="none"
        strokeWidth={strokeWidth} // <-- Dùng style động
      />
      <foreignObject
        x={isLeft ? x - iconSize : x}
        y={y - iconSize / 2}
        width={iconSize}
        height={iconSize}
      >
        <FontAwesomeIcon
          icon={icon}
          style={{ width: "100%", height: "100%", color: payload.fill }}
        />
      </foreignObject>
      <text
        x={isLeft ? x - iconSize - textOffset : x + iconSize + textOffset}
        y={y}
        dominantBaseline="central"
        fontSize={fontSize} // <-- Dùng style động
        fontWeight={fontWeight} // <-- Dùng style động
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

// Component Sector custom khi click (không thay đổi)
const renderActiveShape = (props) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    value,
  } = props;

  return (
    <g>
      <text
        x={cx}
        y={cy - 12}
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
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{
          filter: `drop-shadow(0px 4px 8px ${fill}60)`,
        }}
      />
    </g>
  );
};

const CategoryExpenseChart = ({
  data,
  total,
  loading,
  error,
  onSliceClick,
  activeCategoryId, // Nhận prop từ cha
}) => {
  // Đảm bảo dữ liệu luôn có màu sắc
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item, index) => ({
      ...item,
      color: item.color || COLORS[index % COLORS.length],
    }));
  }, [data]);

  // Bỏ state nội bộ, tính toán activeIndex từ prop
  const activeIndex = useMemo(
    () =>
      activeCategoryId ? processedData.findIndex((d) => d.id === activeCategoryId) : -1,
    [processedData, activeCategoryId]
  );

  if (loading) return <p className={styles.loadingText}>Đang tải...</p>;
  if (error) return <p className={styles.errorText}>{error}</p>;
  if (!processedData || processedData.length === 0) {
    return (
      <p className={styles.noDataText}>
        Không có dữ liệu cho khoảng thời gian này.
      </p>
    );
  }

  const handlePieClick = (pieData, index) => {
    // Luôn gọi onSliceClick với dữ liệu của slice được click
    // `CategoriesPage` sẽ quyết định nên chọn hay bỏ chọn
    if (onSliceClick) {
      onSliceClick(processedData[index]);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className={styles.customTooltip}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {d.icon && <FontAwesomeIcon icon={getIconObject(d.icon)} />}
            <span style={{ fontWeight: 600 }}>{d.name}</span>
          </div>
          <div>
            Số tiền: <b>{formatCurrency(d.value)}</b>
          </div>
          <div>
            Tỉ lệ: <b>{((d.value / total) * 100).toFixed(1)}%</b>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ position: "relative", width: "100%", height: 400 }}>
      {/* Hiển thị tổng tiền khi không có slice nào được chọn */}
      {activeIndex === -1 && (
        <div className={styles.centerLabel}>
          <span>Tổng cộng</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
      )}
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            onClick={handlePieClick}
            isAnimationActive={true}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            label={(props) => {
              // activeIndex đã được tính toán ở trên từ prop
              const isActive = props.index === activeIndex;

              // Nếu có một slice đang được chọn, và đây không phải slice đó -> không vẽ label.
              if (activeIndex !== -1 && !isActive) {
                return null;
              }

              // Ngược lại (không có slice nào được chọn HOẶC đây là slice đang được chọn),
              // thì gọi hàm render với đầy đủ thông tin.
              return renderCustomizedLabel({ ...props, isActive });
            }}
            labelLine={false}
          >
            {processedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{ cursor: "pointer" }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryExpenseChart;
