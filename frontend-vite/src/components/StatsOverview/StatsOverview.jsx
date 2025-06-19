// Mở và THAY THẾ TOÀN BỘ file: src/components/StatsOverview/StatsOverview.jsx

import React, { useState } from "react";
import styles from "./StatsOverview.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faArrowDown,
  faArrowUp,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import AddEditTransactionModal from "../Transactions/AddEditTransactionModal"; // Sửa lại tên component Modal

// Hàm tiện ích định dạng tiền tệ
const formatCurrency = (amount) => {
  if (typeof amount !== "number") {
    return "0 ₫";
  }
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

// Component nhận props từ cha, không tự fetch dữ liệu
const StatsOverview = ({ stats, loading }) => {
  // <--- NHẬN PROPS stats và loading
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hàm này giờ cần được xử lý ở component cha, nhưng tạm thời giữ lại để nút "Thêm" hoạt động
  const handleTransactionAdded = () => {
    setIsModalOpen(false);
    window.location.reload(); // Tạm thời reload để cập nhật
  };

  if (loading) {
    return <div className={styles.loading}>Đang tải dữ liệu tổng quan...</div>;
  }

  // Nếu không loading và không có stats, hiển thị thông báo
  if (!stats) {
    return <div className={styles.noData}>Không có dữ liệu để hiển thị.</div>;
  }

  // Dữ liệu tháng/năm giờ sẽ được API trả về trong object stats
  const currentMonthYearLabel =
    stats.currentMonthYear ||
    `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`;

  return (
    <div className={styles.statsOverviewContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <FontAwesomeIcon icon={faChartLine} className={styles.titleIcon} />
          Tổng quan chi tiêu
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className={styles.addTransactionButton}
        >
          <FontAwesomeIcon icon={faPlus} /> Thêm giao dịch
        </button>
      </div>

      <div className={styles.statsCards}>
        {/* Card Thu nhập */}
        <div className={`${styles.statCard} ${styles.incomeCard}`}>
          {/* ... phần JSX của card thu nhập giữ nguyên ... */}
          <div
            className={styles.cardIconWrapper}
            style={{ backgroundColor: "rgba(76, 175, 80, 0.1)" }}
          >
            <FontAwesomeIcon
              icon={faArrowDown}
              className={styles.cardIcon}
              style={{ color: "#4CAF50" }}
            />
          </div>
          <div className={styles.cardContent}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Thu nhập</h3>
              <span className={styles.cardPeriod}>
                {stats.income?.monthYear || currentMonthYearLabel}
              </span>
            </div>
            <p className={styles.cardAmount}>
              {formatCurrency(stats.income?.amount)}
            </p>
            {stats.income?.changeDescription && (
              <p
                className={`${styles.cardChange} ${
                  (stats.income?.percentageChange || 0) >= 0
                    ? styles.positiveChange
                    : styles.negativeChange
                }`}
              >
                <FontAwesomeIcon
                  icon={
                    (stats.income?.percentageChange || 0) >= 0
                      ? faArrowUp
                      : faArrowDown
                  }
                />
                <strong>
                  ({stats.income.percentageChange > 0 ? "+" : ""}
                  {stats.income.percentageChange}%)
                </strong>{" "}
                {stats.income.changeDescription}
              </p>
            )}
          </div>
        </div>

        {/* Card Chi tiêu */}
        <div className={`${styles.statCard} ${styles.expenseCard}`}>
          {/* ... phần JSX của card chi tiêu giữ nguyên ... */}
          <div
            className={styles.cardIconWrapper}
            style={{ backgroundColor: "rgba(244, 67, 54, 0.1)" }}
          >
            <FontAwesomeIcon
              icon={faArrowUp}
              className={styles.cardIcon}
              style={{ color: "#f44336" }}
            />
          </div>
          <div className={styles.cardContent}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Chi tiêu</h3>
              <span className={styles.cardPeriod}>
                {stats.expense?.monthYear || currentMonthYearLabel}
              </span>
            </div>
            <p className={styles.cardAmount}>
              {formatCurrency(stats.expense?.amount)}
            </p>
            {stats.expense?.changeDescription && (
              <p
                className={`${styles.cardChange} ${
                  (stats.expense?.percentageChange || 0) >= 0
                    ? styles.positiveChange
                    : styles.negativeChange
                }`}
              >
                <FontAwesomeIcon
                  icon={
                    (stats.expense?.percentageChange || 0) >= 0
                      ? faArrowUp
                      : faArrowDown
                  }
                />
                <strong>
                  ({stats.expense.percentageChange > 0 ? "+" : ""}
                  {stats.expense.percentageChange}%)
                </strong>{" "}
                {stats.expense.changeDescription}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal thêm giao dịch */}
      {/* Lưu ý: Tên component modal là AddEditTransactionModal */}
      <AddEditTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={handleTransactionAdded}
        mode="add"
      />
    </div>
  );
};

export default StatsOverview;
