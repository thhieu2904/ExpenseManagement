// frontend-vite/src/components/DetailedAnalyticsSection/CategoryExpenseChart.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getIconObject } from "../../utils/iconMap"; // Sử dụng iconMap có sẵn
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./CategoryExpenseChart.module.css";

const COLORS = [
  "#0088FE",
  "#FF4560",
  "#FFD600",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
];

// Hàm render label tùy chỉnh bên ngoài biểu đồ
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  payload,
}) => {
  const RADIAN = Math.PI / 180;
  const labelRadius = outerRadius + 30; // Khoảng cách từ tâm ra nhãn
  const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
  const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);
  const icon = getIconObject(payload.icon); // Lấy object icon từ map

  return (
    <g>
      <path
        d={`M${cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN)},${
          cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN)
        } L${x},${y}`}
        stroke="#999"
        fill="none"
        strokeWidth={1}
      />
      <foreignObject
        x={x > cx ? x + 5 : x - 30}
        y={y - 28}
        width="25"
        height="25"
      >
        <FontAwesomeIcon icon={icon} size="lg" color="#333" />
      </foreignObject>
      <text
        x={x > cx ? x + 5 : x - 5}
        y={y + 10}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fill="#333"
        fontSize="13"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(2)}%`}
      </text>
    </g>
  );
};

const CategoryExpenseChart = ({ period, currentDate }) => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    // Nếu chưa có props thì không làm gì cả
    if (!period || !currentDate) return;

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập.");
        return;
      }

      // Tạo đối tượng params một cách linh hoạt
      const params = { period };
      switch (period) {
        case "year":
          params.year = currentDate.getFullYear();
          break;
        case "month":
          params.year = currentDate.getFullYear();
          params.month = currentDate.getMonth() + 1;
          break;
        case "week":
          params.date = currentDate.toISOString().split("T")[0]; // Gửi định dạng YYYY-MM-DD
          break;
        default:
          throw new Error("Invalid period provided");
      }

      const response = await axios.get(
        "http://localhost:5000/api/statistics/by-category",
        {
          headers: { Authorization: `Bearer ${token}` },
          // Gửi đi params đã được tạo
          params: params,
        }
      );

      const apiData = response.data;
      setData(apiData);

      const totalAmount = apiData.reduce((sum, item) => sum + item.value, 0);
      setTotal(totalAmount);
    } catch (err) {
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [period, currentDate]); // ✨ THAY ĐỔI 3: Cập nhật dependency array

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value) =>
    value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>Cơ cấu chi phí</h3>
      {loading && <p className={styles.loadingText}>Đang tải biểu đồ...</p>}
      {error && <p className={styles.errorText}>{error}</p>}
      {!loading && !error && data.length === 0 && (
        <p className={styles.noDataText}>Không có dữ liệu chi tiêu.</p>
      )}

      {!loading && !error && data.length > 0 && (
        <div style={{ position: "relative", width: "100%", height: 400 }}>
          <div className={styles.centerLabel}>
            <span>Tổng cộng</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={3}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                labelLine={false}
                label={renderCustomizedLabel}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CategoryExpenseChart;
