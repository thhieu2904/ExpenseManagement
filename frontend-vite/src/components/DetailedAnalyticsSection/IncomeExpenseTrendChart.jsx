// src/components/DetailedAnalyticsSection/IncomeExpenseTrendChart.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
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

// Hàm tiện ích định dạng tiền tệ cho Tooltip và YAxis
const formatCurrency = (value) => {
  if (value === 0) return "0 ₫";
  if (!value) return "";
  return `${(value / 1000000).toLocaleString("vi-VN")}tr ₫`; // Hiển thị triệu đồng
};

// Hàm lấy ngày bắt đầu của tuần, tháng, năm
const getStartDate = (period) => {
  const today = new Date();
  if (period === "week") {
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6); // 7 ngày bao gồm hôm nay
    return startDate.toISOString().split("T")[0];
  }
  if (period === "month") {
    // Lấy dữ liệu cho cả năm hiện tại, hiển thị theo tháng
    return new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
  }
  if (period === "year") {
    // Lấy dữ liệu cho nhiều năm
    // API của bạn cần hỗ trợ việc này, ví dụ không cần startDate hoặc startDate rất xa
    return new Date(today.getFullYear() - 3, 0, 1).toISOString().split("T")[0]; // Ví dụ lấy 3 năm trước
  }
  return today.toISOString().split("T")[0];
};

const IncomeExpenseTrendChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("month"); // 'week', 'month', 'year'
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear()); // Cho tiêu đề

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

      let apiUrl = `http://localhost:5000/api/statistics/trend?period=${period}`;

      if (period === "week") {
        apiUrl += `&startDate=${getStartDate("week")}`;
      } else if (period === "month") {
        apiUrl += `&year=${currentYear}`;
      }

      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formattedData = response.data.map((item) => ({
        name: item.name, // Có thể là "2025-01", "2025-05-17", hoặc "2023"
        income: item.income || 0,
        expense: item.expense || 0,
      }));

      setData(formattedData);
    } catch (err) {
      console.error("Lỗi tải dữ liệu xu hướng:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [period, currentYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getChartTitle = () => {
    if (period === "week") return "Xu hướng thu chi 7 ngày qua";
    if (period === "month") return `Xu hướng thu chi năm ${currentYear}`;
    if (period === "year") return "Xu hướng thu chi qua các năm";
    return "Xu hướng thu chi";
  };

  return (
    <div className={styles.chartContainer}>
      <div className={styles.header}>
        <h3 className={styles.chartTitle}>{getChartTitle()}</h3>
        <div className={styles.filterButtons}>
          <button
            onClick={() => setPeriod("week")}
            className={period === "week" ? styles.active : ""}
          >
            Tuần
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={period === "month" ? styles.active : ""}
          >
            Tháng
          </button>
          <button
            onClick={() => setPeriod("year")}
            className={period === "year" ? styles.active : ""}
          >
            Năm
          </button>
        </div>
      </div>

      {loading && <p className={styles.loadingText}>Đang tải biểu đồ...</p>}
      {error && <p className={styles.errorText}>{error}</p>}
      {!loading && !error && data.length === 0 && (
        <p className={styles.noDataText}>
          Không có dữ liệu cho khoảng thời gian này.
        </p>
      )}

      {!loading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 30, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="name" stroke="#666" tick={{ fontSize: 12 }}>
              <Label
                value={
                  period === "week"
                    ? "Ngày"
                    : period === "month"
                    ? "Tháng"
                    : "Năm"
                }
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
              formatter={(value, name) => [
                `${(value || 0).toLocaleString("vi-VN")} ₫`,
                name,
              ]}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Line
              type="monotone"
              dataKey="income"
              name="Thu nhập"
              stroke="#4CAF50"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
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
