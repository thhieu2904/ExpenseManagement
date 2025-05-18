// src/components/DetailedAnalyticsSection/CategoryExpenseChart.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./CategoryExpenseChart.module.css";

const formatCurrency = (value) => {
  if (value === 0) return "0 ₫";
  if (!value) return "";
  return `${value.toLocaleString("vi-VN")} ₫`;
};

// Màu sắc cho biểu đồ tròn (bạn có thể mở rộng danh sách này)
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF4560",
  "#775DD0",
  "#546E7A",
  "#26a69a",
  "#D10CE8",
];

const CategoryExpenseChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const processDataForChart = (apiData) => {
    if (!apiData || apiData.length === 0) return [];

    // Sắp xếp theo số tiền chi tiêu giảm dần
    const sortedData = [...apiData].sort((a, b) => b.total - a.total);

    if (sortedData.length <= 5) {
      return sortedData.map((item) => ({
        name: item.category,
        value: item.total,
      }));
    }

    const top5 = sortedData.slice(0, 5).map((item) => ({
      name: item.category,
      value: item.total,
    }));

    const otherTotal = sortedData
      .slice(5)
      .reduce((sum, item) => sum + item.total, 0);

    return [...top5, { name: "Khác", value: otherTotal }];
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập.");
        setLoading(false);
        return;
      }
      // API của bạn có thể cần tham số thời gian, ví dụ: ?period=current_month
      // Hoặc bạn có thể lấy dữ liệu cho một khoảng thời gian cố định
      const response = await axios.get(
        "http://localhost:5000/api/statistics/by-category", // Thêm tham số nếu API yêu cầu
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // API response: [{ categoryId: "1", categoryName: "Ăn uống", totalExpense: 5000000 }, ...]
      const chartData = processDataForChart(response.data);
      setData(chartData);
    } catch (err) {
      console.error("Lỗi tải dữ liệu danh mục:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    console.log("Dữ liệu biểu đồ:", data);
  }, [data]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipLabel}>{`${
            payload[0].name
          } : ${formatCurrency(payload[0].value)}`}</p>
          <p className={styles.tooltipPercentage}>{`(${(
            payload[0].percent * 100
          ).toFixed(2)}%)`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>Chi tiêu theo danh mục</h3>
      {loading && <p className={styles.loadingText}>Đang tải biểu đồ...</p>}
      {error && <p className={styles.errorText}>{error}</p>}
      {!loading && !error && data.length === 0 && (
        <p className={styles.noDataText}>
          Không có dữ liệu chi tiêu theo danh mục.
        </p>
      )}

      {!loading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              // label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} // Hiển thị label trên slice
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ paddingLeft: "20px" }}
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default CategoryExpenseChart;
