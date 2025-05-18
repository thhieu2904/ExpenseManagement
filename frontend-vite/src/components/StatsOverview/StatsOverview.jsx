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
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStatsOverview = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Bạn chưa đăng nhập. Vui lòng đăng nhập để xem thông tin.");
          setLoading(false);
          // Tùy chọn: chuyển hướng về trang login
          // navigate('/login');
          return;
        }

        const response = await axios.get(
          "http://localhost:5000/api/statistics/overview",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setStats(response.data);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu tổng quan:", err);
        if (err.response && err.response.status === 401) {
          setError(
            "Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại."
          );
          // Tùy chọn: Xóa token cũ và chuyển hướng
          // localStorage.removeItem('token');
          // localStorage.removeItem('user');
          // navigate('/login');
        } else if (
          err.response &&
          err.response.data &&
          err.response.data.message
        ) {
          setError(`Lỗi từ server: ${err.response.data.message}`);
        } else {
          setError("Không thể tải dữ liệu tổng quan. Vui lòng thử lại sau.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStatsOverview();
  }, [navigate]);

  const handleAddTransaction = () => {
    // Điều hướng đến trang thêm giao dịch hoặc mở modal
    // Ví dụ: navigate('/transactions/new');
    console.log("Chuyển đến trang thêm giao dịch");
    // Bạn cần tạo route và component cho trang này
    navigate("/transactions/new"); // Giả sử bạn có route này
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

        {/* Card Số dư */}
        <div className={`${styles.statCard} ${styles.balanceCard}`}>
          <div
            className={styles.cardIconWrapper}
            style={{ backgroundColor: "rgba(96, 125, 139, 0.1)" }}
          >
            <FontAwesomeIcon
              icon={faWallet}
              className={styles.cardIcon}
              style={{ color: "#607D8B" }}
            />
          </div>
          <div className={styles.cardContent}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Số dư</h3>
              <span className={styles.cardPeriod}>Hiện tại</span>
            </div>
            <p className={styles.cardAmount}>
              {formatCurrency(stats.balance?.amount)}
            </p>
            {/* // Phần hiển thị thay đổi của "Chênh lệch tháng" */}
            {stats.balance?.changeDescription && (
              <p
                className={`${styles.cardChange} ${
                  // Nếu percentageChange >= 0 (tăng hoặc không đổi) -> positiveChange (màu xanh)
                  // Nếu percentageChange < 0 (giảm) -> negativeChange (màu đỏ)
                  (stats.balance?.percentageChange || 0) >= 0
                    ? styles.positiveChange
                    : styles.negativeChange
                }`}
              >
                <FontAwesomeIcon
                  icon={
                    // Tương tự, icon mũi tên lên cho >= 0, mũi tên xuống cho < 0
                    (stats.balance?.percentageChange || 0) >= 0
                      ? faArrowUp
                      : faArrowDown
                  }
                />
                <strong>
                  ({stats.balance.percentageChange > 0 ? "+" : ""}
                  {stats.balance.percentageChange}%)
                </strong>{" "}
                {stats.balance.changeDescription}{" "}
                {/* Mô tả từ backend: "Tăng X%" hoặc "Giảm X%" */}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
