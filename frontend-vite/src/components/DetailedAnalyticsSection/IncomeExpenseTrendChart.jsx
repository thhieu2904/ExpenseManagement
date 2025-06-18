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

const formatCurrency = (value) => {
  if (value === 0) return "0 ₫";
  if (!value) return "";
  return `${(value / 1000000).toLocaleString("vi-VN")}tr ₫`;
};

// Component giờ chỉ nhận props và hiển thị biểu đồ
const IncomeExpenseTrendChart = ({ period, currentDate }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập.");

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      let apiUrl = "http://localhost:5000/api/statistics/trend";

      if (period === "month") {
        apiUrl += `?period=day&year=${year}&month=${month}`;
      } else if (period === "year") {
        apiUrl += `?period=month&year=${year}`;
      } else if (period === "week") {
        apiUrl += `?period=day&startDate=${
          currentDate.toISOString().split("T")[0]
        }&days=7`;
      }

      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let formattedData = response.data.map((item) => ({
        name:
          period === "year"
            ? `T${parseInt(item.name.split("-")[1], 10)}`
            : item.name.split("-")[2],
        income: item.income || 0,
        expense: item.expense || 0,
      }));

      setData(formattedData);
    } catch (err) {
      setError("Không thể tải dữ liệu xu hướng.");
    } finally {
      setLoading(false);
    }
  }, [period, currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartTitle}>
        Xu hướng thu nhập và chi tiêu{" "}
        {period === "year" ? "theo tháng" : "theo ngày"}
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
