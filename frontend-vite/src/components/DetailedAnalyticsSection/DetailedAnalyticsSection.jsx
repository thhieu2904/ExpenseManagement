// frontend-vite/src/components/DetailedAnalyticsSection/DetailedAnalyticsSection.jsx
import React, { useState } from "react";
import IncomeExpenseTrendChart from "./IncomeExpenseTrendChart";
import CategoryExpenseChart from "./CategoryExpenseChart";
import styles from "./DetailedAnalyticsSection.module.css";

// Tái sử dụng CSS của biểu đồ đường cho các nút
import chartStyles from "./IncomeExpenseTrendChart.module.css";

const DetailedAnalyticsSection = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [period, setPeriod] = useState("month");

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setCurrentDate(new Date());
  };

  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (period === "week") newDate.setDate(newDate.getDate() - 7);
    if (period === "month") newDate.setMonth(newDate.getMonth() - 1);
    if (period === "year") newDate.setFullYear(newDate.getFullYear() - 1);
    handleDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (period === "week") newDate.setDate(newDate.getDate() + 7);
    if (period === "month") newDate.setMonth(newDate.getMonth() + 1);
    if (period === "year") newDate.setFullYear(newDate.getFullYear() + 1);
    handleDateChange(newDate);
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

  const getDynamicTitle = () => {
    // Logic này không đổi
    switch (period) {
      case "week":
        return "Phân Tích Chi Tiêu Tuần Này";
      case "month":
        return `Phân Tích Chi Tiêu ${currentDate.toLocaleDateString("vi-VN", {
          month: "long",
          year: "numeric",
        })}`;
      case "year":
        return `Phân Tích Chi Tiêu Năm ${currentDate.getFullYear()}`;
      default:
        return "Phân Tích Chi Tiêu";
    }
  };

  return (
    <div className={styles.analyticsContainer}>
      {/* 1. Header chứa tiêu đề và bộ lọc */}
      <div>
        <h2 className={styles.analyticsTitle}>{getDynamicTitle()}</h2>
      </div>
      <div className={styles.sectionHeader}>
        <div className={chartStyles.controlsGroup}>
          <div className={chartStyles.filterButtons}>
            <button
              onClick={() => handlePeriodChange("week")}
              className={period === "week" ? chartStyles.active : ""}
            >
              Tuần
            </button>
            <button
              onClick={() => handlePeriodChange("month")}
              className={period === "month" ? chartStyles.active : ""}
            >
              Tháng
            </button>
            <button
              onClick={() => handlePeriodChange("year")}
              className={period === "year" ? chartStyles.active : ""}
            >
              Năm
            </button>
          </div>
          <div className={chartStyles.navButtonsBox}>
            <button onClick={handlePrev}>Trước</button>
            <div className={chartStyles.navDateBox}>{getDisplayBox()}</div>
            <button onClick={handleNext}>Sau</button>
          </div>
        </div>
      </div>

      {/* 2. Div cha mới để bọc CẢ HAI biểu đồ */}
      <div className={styles.chartsRow}>
        <div className={styles.trendChartContainer}>
          <IncomeExpenseTrendChart period={period} currentDate={currentDate} />
        </div>
        <div className={styles.categoryChartContainer}>
          <CategoryExpenseChart period={period} currentDate={currentDate} />
        </div>
      </div>
    </div>
  );
};

export default DetailedAnalyticsSection;
