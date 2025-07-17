import React from "react";
import styles from "./SummaryWidget.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";

// Component con cho từng card nhỏ (Thu nhập hoặc Chi tiêu)
const StatCard = ({ type, amount, comparison, variant = "default" }) => {
  const isIncome = type === "income";
  const isCompact = variant === "compact";
  
  return (
    <div className={`${styles.statCard} ${isCompact ? styles.compact : ''}`}>
      <div className={isIncome ? styles.iconIncome : styles.iconExpense}>
        <FontAwesomeIcon icon={isIncome ? faArrowDown : faArrowUp} />
      </div>
      <div className={styles.details}>
        <span className={styles.label}>
          {isIncome ? "Thu nhập" : "Chi tiêu"}
        </span>
        <span className={isIncome ? styles.amountIncome : styles.amountExpense}>
          {amount.toLocaleString("vi-VN")} đ
        </span>
        {!isCompact && (
          <span className={styles.comparison}>{comparison}</span>
        )}
      </div>
    </div>
  );
};

// Component chính của Widget
const SummaryWidget = ({ incomeData, expenseData, isLoading, variant = "default" }) => {
  const isCompact = variant === "compact";
  
  if (isLoading) {
    return <div className={`${styles.widgetContainer} ${isCompact ? styles.compact : ''}`}>Đang tải...</div>;
  }
  if (!incomeData || !expenseData) {
    return (
      <div className={`${styles.widgetContainer} ${isCompact ? styles.compact : ''}`}>
        Không có dữ liệu để hiển thị.
      </div>
    );
  }
  return (
    <div className={`${styles.widgetContainer} ${isCompact ? styles.compact : ''}`}>
      <StatCard
        type="income"
        amount={incomeData.amount}
        comparison={incomeData.comparison}
        variant={variant}
      />
      {!isCompact && <div className={styles.divider}></div>}
      <StatCard
        type="expense"
        amount={expenseData.amount}
        comparison={expenseData.comparison}
        variant={variant}
      />
    </div>
  );
};

export default SummaryWidget;
