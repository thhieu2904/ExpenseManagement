// src/components/Common/SummaryWidgetCompact.jsx
import React from "react";
import styles from "./SummaryWidgetCompact.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";

// Component compact cho header
const SummaryWidgetCompact = ({ incomeData, expenseData, isLoading }) => {
  if (isLoading) {
    return <div className={styles.compactWidget}>Đang tải...</div>;
  }
  
  if (!incomeData || !expenseData) {
    return (
      <div className={styles.compactWidget}>
        <span className={styles.noData}>Không có dữ liệu</span>
      </div>
    );
  }

  return (
    <div className={styles.compactWidget}>
      <div className={styles.statItem}>
        <FontAwesomeIcon icon={faArrowDown} className={styles.incomeIcon} />
        <span className={styles.amount}>
          {incomeData.amount.toLocaleString("vi-VN")}đ
        </span>
      </div>
      <div className={styles.divider}></div>
      <div className={styles.statItem}>
        <FontAwesomeIcon icon={faArrowUp} className={styles.expenseIcon} />
        <span className={styles.amount}>
          {expenseData.amount.toLocaleString("vi-VN")}đ
        </span>
      </div>
    </div>
  );
};

export default SummaryWidgetCompact;
