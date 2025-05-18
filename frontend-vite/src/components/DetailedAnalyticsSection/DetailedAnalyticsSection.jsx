// src/components/DetailedAnalyticsSection/DetailedAnalyticsSection.jsx
import React from "react";
import IncomeExpenseTrendChart from "./IncomeExpenseTrendChart";
import CategoryExpenseChart from "./CategoryExpenseChart";
import styles from "./DetailedAnalyticsSection.module.css";

const DetailedAnalyticsSection = () => {
  // Trong tương lai, bạn có thể truyền props xuống các component con
  // ví dụ như khoảng ngày được chọn từ một bộ lọc cấp cao hơn,
  // để cả hai biểu đồ đồng bộ theo khoảng thời gian đó.
  // For now, each chart will manage its own period or use a default.

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.trendChartContainer}>
        <IncomeExpenseTrendChart />
      </div>
      <div className={styles.categoryChartContainer}>
        <CategoryExpenseChart />
      </div>
    </div>
  );
};

export default DetailedAnalyticsSection;
