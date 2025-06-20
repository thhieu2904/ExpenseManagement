// THAY THẾ TOÀN BỘ FILE: frontend-vite/src/components/DetailedAnalyticsSection/CategoryExpenseChart.jsx

import React, { useState, useEffect } from "react";
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
];

const formatCurrency = (value) =>
  value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

// ✅ Component giờ đây chỉ nhận props và hiển thị, không tự fetch data
const CategoryExpenseChart = ({
  data,
  total,
  loading,
  error,
  onSliceClick,
  activeCategoryId,
}) => {
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    if (activeCategoryId && data) {
      const index = data.findIndex(
        (entry) =>
          entry.id === activeCategoryId || entry._id === activeCategoryId
      );
      setActiveIndex(index !== -1 ? index : null);
    } else {
      setActiveIndex(null);
    }
  }, [activeCategoryId, data]);

  if (loading) {
    return <p className={styles.loadingText}>Đang tải...</p>;
  }
  if (error) {
    return <p className={styles.errorText}>{error}</p>;
  }
  if (!data || data.length === 0) {
    return (
      <p className={styles.noDataText}>
        Không có dữ liệu cho khoảng thời gian này.
      </p>
    );
  }

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    payload,
  }) => {
    if (percent < 0.01) return null;

    const RADIAN = Math.PI / 180;
    const labelRadius = outerRadius + 30;
    const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
    const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);
    const icon = getIconObject(payload.icon);

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
      </g>
    );
  };

  const handlePieClick = (pieData, index) => {
    const newIndex = activeIndex === index ? null : index;
    setActiveIndex(newIndex);
    if (onSliceClick) {
      onSliceClick(newIndex !== null ? data[newIndex] : null);
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
      {activeIndex === null && (
        <div className={styles.centerLabel}>
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
            dataKey="value"
            nameKey="name"
            label={activeIndex === null ? renderCustomizedLabel : false}
            onClick={handlePieClick}
            isAnimationActive={true}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
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
