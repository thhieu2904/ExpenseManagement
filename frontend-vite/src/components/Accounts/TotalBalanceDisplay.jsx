// src/components/Accounts/TotalBalanceDisplay.jsx
import React from "react";
import styles from "./TotalBalanceDisplay.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

const formatCurrency = (amount) => {
  if (typeof amount !== "number" || isNaN(amount)) {
    return "0 ₫";
  }
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

// Component giờ nhận props từ trang cha
const TotalBalanceDisplay = ({ accounts, isLoading }) => {
  if (isLoading) {
    return (
      <div className={styles.totalBalanceContainer}>
        <h3 className={styles.title}>Tổng Quan Nguồn Tiền</h3>
        <div className={styles.loadingContainer}>
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className={styles.loadingIcon}
          />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  // Tính toán số liệu từ props
  const totalBalance = accounts.reduce(
    (sum, acc) => sum + (acc.balance || 0),
    0
  );
  const cashTotal = accounts
    .filter((acc) => acc.type === "TIENMAT")
    .reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const bankTotal = accounts
    .filter((acc) => acc.type === "THENGANHANG")
    .reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return (
    <div className={styles.totalBalanceContainer}>
      <h3 className={styles.title}>Tổng Quan Nguồn Tiền</h3>
      <div className={styles.balanceSection}>
        <div className={styles.balanceLabelAndAmount}>
          <span className={styles.balanceLabel}>Tổng số dư:</span>
          <span className={styles.balanceAmount}>
            {formatCurrency(totalBalance)}
          </span>
        </div>

        <div className={styles.subBalanceContainer}>
          <div className={styles.subBalanceRow}>
            <span>Tiền mặt:</span>
            <span>{formatCurrency(cashTotal)}</span>
          </div>
          <div className={styles.subBalanceRow}>
            <span>Ngân hàng / Thẻ:</span>
            <span>{formatCurrency(bankTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalBalanceDisplay;
