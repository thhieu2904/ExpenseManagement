// frontend-vite/src/components/Categories/CategoryAnalysisChart.jsx

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getIconObject } from "../../utils/iconMap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// Tái sử dụng style từ component biểu đồ của HomePage cho nhất quán
import styles from "../DetailedAnalyticsSection/IncomeExpenseTrendChart.module.css";
import customChartStyles from "./CategoryAnalysisChart.module.css"; // CSS riêng cho biểu đồ

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

const formatCurrency = (value) =>
  value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  payload,
}) => {
  const RADIAN = Math.PI / 180;
  // Giữ nguyên khoảng cách label, bạn có thể chỉnh lại nếu muốn
  const labelRadius = outerRadius + 45;
  const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
  const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);
  const icon = getIconObject(payload.icon);

  // Không hiển thị label cho những phần quá nhỏ
  if (percent < 0.01) {
    return null;
  }

  // ✅ BẮT ĐẦU LOGIC MỚI ĐỂ SẮP XẾP LẠI ICON VÀ TEXT
  const iconSize = 20; // Kích thước của icon
  const textOffset = 5; // Khoảng cách giữa icon và text
  const isLeft = x < cx; // Kiểm tra xem label nằm bên trái hay phải

  return (
    // Sử dụng `textAnchor` để căn chỉnh toàn bộ label (icon + text)
    <g textAnchor={isLeft ? "end" : "start"}>
      {/* Đường kẻ không đổi */}
      <path
        d={`M${cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN)},${
          cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN)
        } L${x},${y}`}
        stroke="#999"
        fill="none"
        strokeWidth={1}
      />

      {/* ICON được đặt ở cuối đường kẻ */}
      <foreignObject
        // Căn chỉnh vị trí icon dựa trên việc nó nằm bên trái hay phải
        x={isLeft ? x - iconSize : x}
        y={y - iconSize / 2} // Căn giữa icon theo chiều dọc
        width={iconSize}
        height={iconSize}
      >
        <FontAwesomeIcon
          icon={icon}
          style={{ width: "100%", height: "100%", color: "#333" }}
        />
      </foreignObject>

      {/* TEXT được đặt ngay cạnh icon */}
      <text
        x={isLeft ? x - iconSize - textOffset : x + iconSize + textOffset}
        y={y}
        dominantBaseline="central" // Căn giữa text theo chiều dọc
        fill="#333"
        fontSize="13"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

const CategoryAnalysisChart = ({
  categoryType,
  period,
  currentDate,
  onPeriodChange,
  onDateChange,
}) => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    if (!period || !currentDate) return;
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const params = { period, type: categoryType };
      if (period === "year") params.year = currentDate.getFullYear();
      if (period === "month") {
        params.year = currentDate.getFullYear();
        params.month = currentDate.getMonth() + 1;
      }
      if (period === "week")
        params.date = currentDate.toISOString().split("T")[0];

      const response = await axios.get(
        "http://localhost:5000/api/statistics/by-category",
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      // ✅ LOGIC ĐƯỢC ĐƠN GIẢN HÓA TRIỆT ĐỂ
      const apiData = response.data || [];

      // Frontend chỉ cần nhận và hiển thị, không cần gộp hay cắt bớt
      const chartData = apiData
        .filter((cat) => cat.value > 0)
        .map((cat) => ({
          name: cat.name,
          value: cat.value,
          icon: cat.icon,
        }));

      setData(chartData);

      // Tổng tiền giờ sẽ được tính từ dữ liệu mà API trả về (đã bao gồm mục "Khác")
      setTotal(chartData.reduce((sum, item) => sum + item.value, 0));
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Không thể tải dữ liệu biểu đồ.";
      console.error("Lỗi khi tải dữ liệu biểu đồ:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [categoryType, period, currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Các hàm điều khiển bộ lọc
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

  const getDisplayBox = () => {
    if (period === "week") {
      const endOfWeek = new Date(currentDate);
      endOfWeek.setDate(currentDate.getDate() + 6);
      return `${currentDate.toLocaleDateString(
        "vi-VN"
      )} - ${endOfWeek.toLocaleDateString("vi-VN")}`;
    }
    if (period === "month")
      return currentDate.toLocaleDateString("vi-VN", {
        month: "long",
        year: "numeric",
      });
    if (period === "year") return `Năm ${currentDate.getFullYear()}`;
    return "";
  };

  const chartTitle =
    categoryType === "THUNHAP"
      ? "Cơ cấu Thu nhập"
      : categoryType === "CHITIEU"
      ? "Cơ cấu Chi tiêu"
      : "Cơ cấu Thu chi";

  return (
    <div className={customChartStyles.chartWrapper}>
      {/* BỘ LỌC ĐƯỢC TÍCH HỢP VÀO ĐÂY */}
      <div className={styles.headerContainer}>
        {/* Hàng 1: Chỉ chứa tiêu đề */}
        <h3 className={styles.chartTitle}>{chartTitle}</h3>

        {/* Hàng 2: Chứa 2 cụm nút điều khiển */}
        <div className={styles.controlsRow}>
          {/* Cụm nút filter nằm bên trái */}

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
            <button onClick={handlePrev}>Trước</button>
            <div className={styles.navDateBox}>{getDisplayBox()}</div>
            <button onClick={handleNext}>Sau</button>
          </div>
        </div>

        {/* Cụm nút điều hướng nằm bên phải */}
      </div>

      {/* PHẦN BIỂU ĐỒ */}
      {loading && <p className={styles.loadingText}>Đang tải...</p>}
      {error && <p className={styles.errorText}>{error}</p>}
      {!loading && !error && data.length === 0 && (
        <p className={styles.noDataText}>Không có dữ liệu.</p>
      )}
      {!loading && !error && data.length > 0 && (
        <div style={{ position: "relative", width: "100%", height: 400 }}>
          <div className={customChartStyles.centerLabel}>
            <span>Tổng cộng</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={2}
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
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CategoryAnalysisChart;
