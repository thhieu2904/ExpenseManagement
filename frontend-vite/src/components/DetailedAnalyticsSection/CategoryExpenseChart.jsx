// frontend-vite/src/components/DetailedAnalyticsSection/CategoryExpenseChart.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getIconObject } from "../../utils/iconMap"; // Sử dụng iconMap có sẵn
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./CategoryExpenseChart.module.css";

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
  // Giữ nguyên khoảng cách label, bạn có thể chỉnh lại nếu muốn
  const labelRadius = outerRadius + 40;
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
      // ======================= BẮT ĐẦU PHẦN SỬA LỖI =======================
      // Luôn đảm bảo dữ liệu đầu vào là một mảng
      const dataToProcess = Array.isArray(apiData) ? apiData : [];

      // "Làm sạch" dữ liệu để đảm bảo `value` luôn là một con số
      const sanitizedData = dataToProcess.map((item) => ({
        ...item,
        // Chuyển đổi item.value thành số, nếu nó là object thì thử lấy amount, nếu không thì ép kiểu, lỗi thì trả về 0
        value: parseFloat(item.value) || 0,
        // Đảm bảo `name` cũng là một chuỗi để tránh lỗi tương tự
        name: String(item.name || "Không xác định"),
      }));

      setData(sanitizedData);

      // Tính tổng trên dữ liệu đã được làm sạch
      const totalAmount = sanitizedData.reduce(
        (sum, item) => sum + item.value,
        0
      );
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
      <div className={styles.chartTitle}>Cơ cấu chi phí</div>{" "}
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
