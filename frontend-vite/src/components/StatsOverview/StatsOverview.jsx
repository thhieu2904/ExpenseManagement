// src/components/StatsOverview/StatsOverview.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./StatsOverview.module.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faArrowDown,
  faArrowUp,
  faWallet,
  faChartLine, // Icon cho tiêu đề "Tổng quan chi tiêu"
} from "@fortawesome/free-solid-svg-icons";
import AddTransactionModal from "../Transactions/AddEditTransactionModal";

// Hàm tiện ích định dạng tiền tệ (ví dụ: 1000000 -> "1.000.000 ₫")
const formatCurrency = (amount) => {
  if (typeof amount !== "number") {
    return "0 ₫";
  }
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

// Hàm tiện ích để lấy tháng/năm hiện tại cho tiêu đề card
const getCurrentMonthYearLabel = (apiMonthYear) => {
  if (
    apiMonthYear &&
    typeof apiMonthYear === "string" &&
    apiMonthYear.includes("/")
  ) {
    return apiMonthYear; // Sử dụng dữ liệu từ API nếu có và đúng định dạng
  }
  const date = new Date();
  return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
};

const StatsOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  //state để mở modal thêm giao dịch
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    const fetchStatsOverview = async () => {
      setLoading(true);
      setError("");
      try {
        // ... logic fetch của bạn giữ nguyên
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Bạn chưa đăng nhập. Vui lòng đăng nhập để xem thông tin.");
          setLoading(false);
          return;
        }
        const response = await axios.get(
          "http://localhost:5000/api/statistics/overview",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStats(response.data);
      } catch (err) {
        // ... logic catch lỗi của bạn giữ nguyên
        console.error("Lỗi khi tải dữ liệu tổng quan:", err);
        setError("Không thể tải dữ liệu tổng quan. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchStatsOverview();
  }, []); // Thêm mảng phụ thuộc rỗng để useEffect chỉ chạy một lần sau khi mount

  const handleAddTransaction = () => {
    setIsModalOpen(true);
  };

  const handleTransactionAdded = () => {
    setIsModalOpen(false); // Đóng modal
    window.location.reload(); // Cách đơn giản nhất để làm mới toàn bộ dữ liệu trang
  };

  if (loading) {
    return <div className={styles.loading}>Đang tải dữ liệu tổng quan...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!stats) {
    return <div className={styles.noData}>Không có dữ liệu để hiển thị.</div>;
  }

  // Sử dụng hàm getCurrentMonthYearLabel để có nhãn tháng/năm
  const currentMonthYearLabel = getCurrentMonthYearLabel(
    stats.currentMonthYear
  );

  return (
    <div className={styles.statsOverviewContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <FontAwesomeIcon icon={faChartLine} className={styles.titleIcon} />
          Tổng quan chi tiêu
        </h2>
        <button
          onClick={handleAddTransaction}
          className={styles.addTransactionButton}
        >
          <FontAwesomeIcon icon={faPlus} /> Thêm giao dịch
        </button>
      </div>

      <div className={styles.statsCards}>
        {/* Card Thu nhập */}
        <div className={`${styles.statCard} ${styles.incomeCard}`}>
          <div
            className={styles.cardIconWrapper}
            style={{ backgroundColor: "rgba(76, 175, 80, 0.1)" }}
          >
            {" "}
            {/* Nền nhạt hơn cho icon */}
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
                {/* Biểu tượng mũi tên cho chi tiêu thường ngược lại với ý nghĩa tăng/giảm của số liệu */}
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
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={handleTransactionAdded}
      />
    </div>
  );
};

export default StatsOverview;
