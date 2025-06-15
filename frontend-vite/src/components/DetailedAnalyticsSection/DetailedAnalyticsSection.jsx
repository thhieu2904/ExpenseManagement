// frontend-vite/src/components/DetailedAnalyticsSection/DetailedAnalyticsSection.jsx
import React, { useState } from "react"; // Thêm useState
import IncomeExpenseTrendChart from "./IncomeExpenseTrendChart";
import CategoryExpenseChart from "./CategoryExpenseChart";
import styles from "./DetailedAnalyticsSection.module.css";

const DetailedAnalyticsSection = () => {
  // ✨ Nâng state quản lý thời gian lên đây ✨
  const [currentDate, setCurrentDate] = useState(new Date());
  const [period, setPeriod] = useState("month"); // Mặc định là 'month'

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // Hàm để các component con có thể thay đổi state ở cha
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setCurrentDate(new Date()); // Reset về ngày hiện tại khi đổi chế độ xem
  };

  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
  };

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.trendChartContainer}>
        {/* ✨ Truyền state và các hàm xử lý xuống cho biểu đồ đường ✨ */}
        <IncomeExpenseTrendChart
          period={period}
          currentDate={currentDate}
          onPeriodChange={handlePeriodChange}
          onDateChange={handleDateChange}
        />
      </div>
      <div className={styles.categoryChartContainer}>
        {/* ✨ Truyền year và month xuống cho biểu đồ tròn ✨ */}
        <CategoryExpenseChart period={period} currentDate={currentDate} />
      </div>
    </div>
  );
};

export default DetailedAnalyticsSection;
