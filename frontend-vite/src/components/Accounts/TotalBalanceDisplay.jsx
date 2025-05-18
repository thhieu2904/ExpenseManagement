import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import styles from "./TotalBalanceDisplay.module.css"; // Đảm bảo đường dẫn này đúng
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

// Hàm định dạng tiền tệ
const formatCurrency = (amount) => {
  if (typeof amount !== "number" || isNaN(amount)) {
    return "0 ₫";
  }
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

const TotalBalanceDisplay = ({ refreshTrigger }) => {
  const [totalBalance, setTotalBalance] = useState(0);
  const [cashTotal, setCashTotal] = useState(0);
  const [bankTotal, setBankTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Hàm chính để lấy và xử lý dữ liệu tài khoản
  const fetchAccountData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập để xem số dư.");
        setTotalBalance(0);
        setCashTotal(0);
        setBankTotal(0);
        setIsLoading(false); // Quan trọng: dừng loading nếu không có token
        return;
      }

      const response = await axios.get("http://localhost:5000/api/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && Array.isArray(response.data)) {
        let calculatedTotal = 0;
        let calculatedCash = 0;
        let calculatedBank = 0;

        response.data.forEach((account) => {
          // Sử dụng 'initialBalance' vì nó hoạt động cho tiền mặt/ngân hàng.
          // Nếu backend có trường 'balance' riêng biệt và đúng, bạn có thể xem xét lại.
          const balance = parseFloat(account.initialBalance);
          const numericBalance = isNaN(balance) ? 0 : balance;

          calculatedTotal += numericBalance;

          if (account.type === "TIENMAT") {
            calculatedCash += numericBalance;
          } else {
            // Giả sử các loại tài khoản khác được tính vào "Ngân hàng / Thẻ"
            calculatedBank += numericBalance;
          }
        });

        setTotalBalance(calculatedTotal);
        setCashTotal(calculatedCash);
        setBankTotal(calculatedBank);
      } else {
        setError("Không có dữ liệu tài khoản hoặc định dạng không đúng.");
        setTotalBalance(0);
        setCashTotal(0);
        setBankTotal(0);
      }
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu tài khoản:", err);
      setError("Không thể tải dữ liệu tài khoản. Vui lòng thử lại sau.");
      setTotalBalance(0);
      setCashTotal(0);
      setBankTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, []); // useCallback không có dependencies vì nó chỉ định nghĩa hàm

  // useEffect để gọi fetchAccountData khi component mount hoặc refreshTrigger thay đổi
  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData, refreshTrigger]);

  return (
    <div className={styles.totalBalanceContainer}>
      <h3 className={styles.title}>Tài khoản và thẻ của bạn</h3>
      <div className={styles.balanceSection}>
        {/* Phần hiển thị tổng số dư */}
        {!isLoading && !error && (
          <div className={styles.balanceLabelAndAmount}>
            <span className={styles.balanceLabel}>Tổng số dư:</span>
            <span className={styles.balanceAmount}>
              {formatCurrency(totalBalance)}
            </span>
          </div>
        )}

        {/* Icon Loading */}
        {isLoading && (
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className={styles.loadingIcon}
          />
        )}

        {/* Thông báo lỗi */}
        {!isLoading && error && (
          <span className={styles.errorText} title={error}>
            <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
          </span>
        )}

        {/* Container cho các số dư chi tiết (chỉ hiển thị khi không loading và không có lỗi) */}
        {!isLoading && !error && (
          <div className={styles.subBalanceContainer}>
            <div className={styles.subBalanceRow}>
              <span>Tiền mặt:</span>
              {/* Sử dụng formatCurrency cho nhất quán hoặc giữ toLocaleString nếu muốn */}
              <span>{formatCurrency(cashTotal)}</span>
            </div>
            <div className={styles.subBalanceRow}>
              <span>Ngân hàng / Thẻ:</span>
              <span>{formatCurrency(bankTotal)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TotalBalanceDisplay;
