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

// Hàm tiện ích định dạng tiền tệ (Không đổi)
const formatCurrency = (value) => {
  if (value === 0) return "0 ₫";
  if (!value) return "";
  return `${(value / 1000000).toLocaleString("vi-VN")}tr ₫`;
};

const IncomeExpenseTrendChart = () => {
  // --- BƯỚC 1: THAY ĐỔI STATE ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("month"); // Giữ nguyên, mặc định là xem theo tháng

  // Bỏ state cũ (currentYear, currentWeekStart) và dùng state trung tâm mới
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- BƯỚC 2: CẬP NHẬT CÁC HÀM XỬ LÝ ---

  // Hàm điều hướng mới, hoạt động dựa trên 'period'
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    switch (period) {
      case "week":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case "year":
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
      default:
        break;
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    switch (period) {
      case "week":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case "year":
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
      default:
        break;
    }
    setCurrentDate(newDate);
  };

  // Hàm hiển thị box ngày tháng mới
  const getDisplayBox = () => {
    switch (period) {
      case "week":
        const endOfWeek = new Date(currentDate);
        endOfWeek.setDate(currentDate.getDate() + 6);
        return `${currentDate.toLocaleDateString(
          "vi-VN"
        )} - ${endOfWeek.toLocaleDateString("vi-VN")}`;
      case "month":
        return currentDate.toLocaleDateString("vi-VN", {
          month: "long",
          year: "numeric",
        });
      case "year":
        return `Năm ${currentDate.getFullYear()}`;
      default:
        return "";
    }
  };

  // Hàm lấy tiêu đề biểu đồ mới
  const getChartTitle = () => {
    switch (period) {
      case "week":
        return "Xu hướng thu chi theo tuần";
      case "month":
        return `Xu hướng thu chi ${currentDate.toLocaleDateString("vi-VN", {
          month: "long",
          year: "numeric",
        })}`;
      case "year":
        return `Xu hướng thu chi năm ${currentDate.getFullYear()}`;
      default:
        return "Xu hướng thu chi";
    }
  };

  // --- BƯỚC 3: CẬP NHẬT FETCHDATA VỚI LOGIC MỚI HOÀN TOÀN ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        /* ... */ return;
      }

      let apiUrl = "http://localhost:5000/api/statistics/trend";
      let responseData;

      switch (period) {
        case "week": {
          apiUrl += `?period=day&startDate=${
            currentDate.toISOString().split("T")[0]
          }&days=7`;
          const weekResponse = await axios.get(apiUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          responseData = weekResponse.data;
          break;
        }
        case "month": {
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth() + 1;
          apiUrl += `?period=day&year=${year}&month=${month}`;
          const monthResponse = await axios.get(apiUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          responseData = monthResponse.data;
          break;
        }
        case "year": {
          const year = currentDate.getFullYear();
          apiUrl += `?period=month&year=${year}`;
          const yearResponse = await axios.get(apiUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          responseData = yearResponse.data.map((item) => {
            const monthNumber = parseInt(item.name.split("-")[1], 10);
            return { ...item, name: `Tháng ${monthNumber}` };
          });
          break;
        }
        default:
          throw new Error("Invalid period");
      }

      const formattedData = responseData.map((item) => ({
        name: item.name,
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
  }, [period, currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- BƯỚC 4: RENDER JSX (Không thay đổi cấu trúc) ---
  return (
    <div className={styles.chartContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
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
        <div className={styles.navButtonsBox}>
          <button onClick={handlePrev}>Trước</button>
          <div className={styles.navDateBox}>{getDisplayBox()}</div>
          <button onClick={handleNext}>Sau</button>
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
                value={period === "year" ? "Tháng" : "Ngày"} // Label trục X thay đổi linh hoạt
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
