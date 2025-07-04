import React, { useState } from "react";
import styles from "./StatsOverview.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faArrowDown,
  faArrowUp,
  faChartLine,
  faExchangeAlt,
} from "@fortawesome/free-solid-svg-icons";
import HeaderCard from "../Common/HeaderCard";
import Button from "../Common/Button";
import AddEditTransactionModal from "../Transactions/AddEditTransactionModal";

// Hàm tiện ích định dạng tiền tệ
const formatCurrency = (amount) => {
  if (typeof amount !== "number") {
    return "0 ₫";
  }
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

// Component nhận props từ cha, không tự fetch dữ liệu
const StatsOverview = ({ stats, loading, onTransactionAdded }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hàm xử lý khi thêm giao dịch thành công
  const handleTransactionAdded = () => {
    setIsModalOpen(false);
    // Nếu có callback từ component cha, gọi nó để refresh dữ liệu
    if (onTransactionAdded) {
      onTransactionAdded();
    } else {
      // Fallback: reload trang nếu không có callback
      window.location.reload();
    }
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

  // Tính toán dòng tiền ròng
  const calculateNetCashFlow = () => {
    const income = stats.income?.amount || 0;
    const expense = stats.expense?.amount || 0;
    return income - expense;
  };

  const netCashFlow = calculateNetCashFlow();
  const isPositiveFlow = netCashFlow >= 0;

  return (
    <div className={styles.statsOverviewContainer}>
      <HeaderCard
        className={styles.statsHeaderCard}
        title={
          <>
            <FontAwesomeIcon icon={faChartLine} className={styles.titleIcon} />
            Tổng quan chi tiêu
          </>
        }
        action={
          <Button
            onClick={() => setIsModalOpen(true)}
            icon={<FontAwesomeIcon icon={faPlus} />}
            variant="primary"
          >
            Thêm giao dịch
          </Button>
        }
        filter={
          <div className={styles.statsCards}>
            {/* Card Thu nhập */}
            <div className={`${styles.statCard} ${styles.incomeCard}`}>
              <div className={styles.cardIconWrapper}>
                <FontAwesomeIcon
                  icon={faArrowDown}
                  className={styles.cardIcon}
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
                      stats.income?.percentageChange === null
                        ? styles.neutralChange
                        : (stats.income?.percentageChange || 0) >= 0
                        ? styles.positiveChange  // Thu nhập tăng = tốt (xanh)
                        : styles.negativeChange  // Thu nhập giảm = xấu (đỏ)
                    }`}
                  >
                    {stats.income?.percentageChange !== null && (
                      <FontAwesomeIcon
                        icon={
                          (stats.income?.percentageChange || 0) >= 0
                            ? faArrowUp
                            : faArrowDown
                        }
                      />
                    )}
                    {stats.income?.percentageChange !== null ? (
                      <strong>
                        ({stats.income.percentageChange > 0 ? "+" : ""}
                        {stats.income.percentageChange}%)
                      </strong>
                    ) : (
                      <strong>🆕 Mới</strong>
                    )}{" "}
                    {stats.income.changeDescription}
                  </p>
                )}
              </div>
            </div>

            {/* Card Chi tiêu */}
            <div className={`${styles.statCard} ${styles.expenseCard}`}>
              <div className={styles.cardIconWrapper}>
                <FontAwesomeIcon
                  icon={faArrowUp}
                  className={styles.cardIcon}
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
                      stats.expense?.percentageChange === null
                        ? styles.neutralChange
                        : (stats.expense?.percentageChange || 0) >= 0
                        ? styles.negativeChange  // Chi tiêu tăng = xấu (đỏ)
                        : styles.positiveChange  // Chi tiêu giảm = tốt (xanh)
                    }`}
                  >
                    {stats.expense?.percentageChange !== null && (
                      <FontAwesomeIcon
                        icon={
                          (stats.expense?.percentageChange || 0) >= 0
                            ? faArrowUp
                            : faArrowDown
                        }
                      />
                    )}
                    {stats.expense?.percentageChange !== null ? (
                      <strong>
                        ({stats.expense.percentageChange > 0 ? "+" : ""}
                        {stats.expense.percentageChange}%)
                      </strong>
                    ) : (
                      <strong>🆕 Mới</strong>
                    )}{" "}
                    {stats.expense.changeDescription}
                  </p>
                )}
              </div>
            </div>

            {/* Card Dòng tiền */}
            <div className={`${styles.statCard} ${styles.cashFlowCard} ${isPositiveFlow ? styles.positiveCashFlow : styles.negativeCashFlow}`}>
              <div className={styles.cardIconWrapper}>
                <FontAwesomeIcon
                  icon={faExchangeAlt}
                  className={styles.cardIcon}
                />
              </div>
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Dòng tiền</h3>
                  <span className={styles.cardPeriod}>
                    {currentMonthYearLabel}
                  </span>
                </div>
                <p className={styles.cardAmount}>
                  {formatCurrency(netCashFlow)}
                </p>
                <p className={`${styles.cardChange} ${styles.cashFlowNeutral}`}>
                  <FontAwesomeIcon
                    icon={isPositiveFlow ? faArrowUp : faArrowDown}
                  />
                  <strong>
                    {isPositiveFlow ? "Dương" : "Âm"}
                  </strong>{" "}
                  {isPositiveFlow ? "Tích lũy được tiền" : "Thiếu hụt ngân sách"}
                </p>
              </div>
            </div>
          </div>
        }
      />
      {/* Modal thêm giao dịch */}
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
