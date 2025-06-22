// src/components/DetailedAnalyticsSection/IncomeExpenseTrendChart.jsx
import React, { useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from "recharts";
import styles from "./IncomeExpenseTrendChart.module.css";

const formatCurrency = (value) => {
  if (value === 0) return "0 ₫";
  if (!value) return "";
  return `${(value / 1000000).toLocaleString("vi-VN")}tr ₫`;
};

// Component giờ chỉ là một "dumb component", nhận dữ liệu và hiển thị
const IncomeExpenseTrendChart = ({
  data,
  period,
  loading,
  error,
  categoryName,
  categoryId,
}) => {
  // useCallback để không phải tính toán lại mỗi lần render, trừ khi data hoặc period thay đổi
  const formatDataForChart = useCallback((rawData, period) => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return [];
    }
    return rawData.map((item) => {
      const dateParts = item.name.split("-");
      let displayName;
      // Dựa trên period được truyền từ component cha để định dạng trục X
      if (period === "year") {
        displayName = `T${parseInt(dateParts[1], 10)}`;
      } else {
        displayName = dateParts[2];
      }
      return {
        name: displayName,
        income: item.income || 0,
        expense: item.expense || 0,
      };
    });
  }, []);

  const chartData = formatDataForChart(data, period);

  const getChartTitle = () => {
    if (categoryName) {
      return `Xu hướng chi tiêu cho "${categoryName}"`;
    }
    return `Xu hướng thu nhập và chi tiêu ${
      period === "year" ? "theo tháng" : "theo ngày"
    }`;
  };

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartTitle}>{getChartTitle()}</div>

      {loading && <p className={styles.loadingText}>Đang tải biểu đồ...</p>}
      {error && <p className={styles.errorText}>{error}</p>}
      {!loading && !error && chartData.length === 0 && (
        <p className={styles.noDataText}>
          Không có dữ liệu cho khoảng thời gian này.
        </p>
      )}
      {!loading && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 30, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="name" stroke="#666" tick={{ fontSize: 12 }}>
              <Label
                value={period === "year" ? "Tháng" : "Ngày"}
                offset={-15}
                position="insideBottom"
              />
            </XAxis>
            <YAxis
              stroke="#666"
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
            >
              <Label
                value="Số tiền (triệu ₫)"
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: "middle" }}
                offset={-20}
              />
            </YAxis>
            <Tooltip
              formatter={(value) => [
                `${(value || 0).toLocaleString("vi-VN")} ₫`,
                null,
              ]}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            {!categoryId && (
              <Line
                type="monotone"
                dataKey="income"
                name="Thu nhập"
                stroke="#4CAF50"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
            <Line
              type="monotone"
              dataKey="expense"
              name="Chi tiêu"
              stroke="#F44336"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default IncomeExpenseTrendChart;
