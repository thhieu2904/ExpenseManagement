// src/components/Accounts/TotalBalanceDisplay.jsx
import React, { useMemo, useCallback } from "react";
import styles from "./TotalBalanceDisplay.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

const formatCurrency = (amount) => {
  if (typeof amount !== "number" || isNaN(amount)) {
    return "0 ₫";
  }
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

const isColorLight = (hexColor) => {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  fill,
  payload,
  index,
  highlightedAccountId, // Nhận từ props
}) => {
  // Không hiển thị label cho slice quá nhỏ
  if (percent * 100 < 1) {
    return null;
  }

  // Kiểm tra xem slice này có đang được highlight không (normalize IDs để so sánh)
  const isHighlighted = String(highlightedAccountId) === String(payload.id);

  // Tính toán vị trí cho đường kẻ và label
  const startRadius = outerRadius + 3;
  const endRadius = outerRadius + (isHighlighted ? 25 : 20);
  const labelRadius = outerRadius + (isHighlighted ? 32 : 28);

  // Tọa độ điểm bắt đầu đường kẻ (từ edge của pie)
  const startX = cx + startRadius * Math.cos(-midAngle * RADIAN);
  const startY = cy + startRadius * Math.sin(-midAngle * RADIAN);

  // Tọa độ điểm kết thúc đường kẻ
  const endX = cx + endRadius * Math.cos(-midAngle * RADIAN);
  const endY = cy + endRadius * Math.sin(-midAngle * RADIAN);

  // Tọa độ cho text (xa hơn một chút)
  const textX = cx + labelRadius * Math.cos(-midAngle * RADIAN);
  const textY = cy + labelRadius * Math.sin(-midAngle * RADIAN);

  // Xác định text alignment dựa trên vị trí
  const textAnchor = textX > cx ? "start" : "end";

  return (
    <g>
      {/* Đường kẻ từ pie ra ngoài */}
      <path
        d={`M${startX},${startY}L${endX},${endY}`}
        stroke={fill}
        strokeWidth={isHighlighted ? 2 : 1.5}
        fill="none"
      />
      
      {/* Text hiển thị % */}
      <text
        x={textX}
        y={textY}
        fill={fill}
        textAnchor={textAnchor}
        dominantBaseline="central"
        fontSize={isHighlighted ? 14 : 12}
        fontWeight={isHighlighted ? 700 : 600}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      
      {/* Text hiển thị tên tài khoản (dòng thứ 2) */}
      <text
        x={textX}
        y={textY + 14}
        fill={isHighlighted ? "#333" : "#666"}
        textAnchor={textAnchor}
        dominantBaseline="central"
        fontSize={isHighlighted ? 11 : 10}
        fontWeight={isHighlighted ? 500 : 400}
      >
        {payload.name.length > 12 ? payload.name.substring(0, 12) + "..." : payload.name}
      </text>
    </g>
  );
};

const TotalBalanceDisplay = ({
  accounts,
  isLoading,
  highlightedAccountId,
  onHoverAccount,
}) => {
  // Memoize chartData để tránh re-compute không cần thiết
  const chartData = useMemo(() => {
    const positiveAccounts = accounts.filter((acc) => acc.balance > 0);
    const totalPositiveBalance = positiveAccounts.reduce(
      (sum, acc) => sum + acc.balance,
      0
    );
    
    return positiveAccounts.map((acc) => ({
      ...acc,
      percent: totalPositiveBalance > 0 ? acc.balance / totalPositiveBalance : 0,
    }));
  }, [accounts]);

  // Memoize label renderer để tránh re-create function
  const customLabelRenderer = useCallback((props) => 
    renderCustomizedLabel({ ...props, highlightedAccountId }), 
    [highlightedAccountId]
  );

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <FontAwesomeIcon icon={faSpinner} spin className={styles.loadingIcon} />
      </div>
    );
  }

  // Tính tổng số dư ròng để hiển thị
  const totalNetBalance = accounts.reduce(
    (sum, acc) => sum + (acc.balance || 0),
    0
  );

  return (
    <div className={styles.totalBalanceContainer}>
      <h3>Tổng Quan Nguồn Tiền</h3>

      {/* Hiển thị tổng số dư ròng */}
      <div
        className={`${styles.totalAmount} ${
          totalNetBalance < 0 ? styles.negativeTotal : ""
        }`}
      >
        {totalNetBalance < 0 && (
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            style={{ color: "#e74c3c", marginRight: 6 }}
          />
        )}
        {formatCurrency(totalNetBalance)}
      </div>
      <div className={styles.totalLabel}>Tổng số dư</div>

      {/* Container cố định cho biểu đồ và legend */}
      <div className={styles.chartAndLegendContainer}>
        <div className={styles.chartSection}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart margin={{ top: 15, right: 80, bottom: 50, left: 80 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={45}
                outerRadius={65}
                fill="#8884d8"
                paddingAngle={3}
                dataKey="balance"
                nameKey="name"
                labelLine={false}
                label={customLabelRenderer}
                isAnimationActive={false}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke={String(highlightedAccountId) === String(entry.id) ? "#666" : "#fff"}
                    strokeWidth={String(highlightedAccountId) === String(entry.id) ? 2 : 1}
                    onClick={() => {
                      if (onHoverAccount) {
                        // Toggle: nếu đang active thì deselect, nếu không thì select
                        onHoverAccount(String(highlightedAccountId) === String(entry.id) ? null : entry.id);
                      }
                    }}
                    style={{
                      cursor: "pointer",
                      filter:
                        String(highlightedAccountId) === String(entry.id)
                          ? "drop-shadow(0 0 8px #8884d8)"
                          : "none",
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [
                  `${value.toLocaleString("vi-VN")} ₫`,
                  props.payload.name,
                ]}
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

        <div className={styles.legendSection}>
          <ul className={styles.legendList}>
            {chartData.map((entry, index) => (
              <li
                key={`item-${index}`}
                className={styles.legendItem}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  transition: "background 0.2s",
                }}
              >
                <span
                  className={styles.legendIcon}
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className={styles.legendInfo}>
                  <span className={styles.legendText}>{entry.name}</span>
                  <span className={styles.legendPercent}>
                    {`(${(entry.percent * 100).toFixed(1)}%)`}
                  </span>
                </div>
                <span className={styles.legendValue}>
                  {formatCurrency(entry.balance)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TotalBalanceDisplay;
