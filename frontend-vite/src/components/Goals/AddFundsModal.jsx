// src/components/Goals/AddFundsModal.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./AddFundsModal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

import Select from "react-select";
const CustomOption = (props) => {
  const { data, innerProps, innerRef, isFocused } = props;
  return (
    <div
      ref={innerRef}
      {...innerProps}
      className={styles.customOption}
      style={{
        backgroundColor: isFocused ? "#f3f4f6" : "transparent",
      }}
    >
      <span className={styles.optionName}>{data.label}</span>
      <span className={styles.optionBalance}>
        {data.balance.toLocaleString("vi-VN")} ₫
      </span>
    </div>
  );
};

export default function AddFundsModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  goalData,
}) {
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchAccountsData = async () => {
      setIsLoading(true); // Bắt đầu loading khi fetch
      // Reset các state quan trọng khi modal mở
      setError("");
      setAmount("");
      // Không reset accountId ở đây, sẽ được set sau khi fetch

      const token = localStorage.getItem("token");
      try {
        const res = await axios.get("http://localhost:5000/api/accounts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedAccounts = res.data || []; // Đảm bảo fetchedAccounts là mảng
        setAccounts(fetchedAccounts);
        if (fetchedAccounts.length > 0) {
          setAccountId(fetchedAccounts[0].id); // Sử dụng .id thay vì ._id và gán tài khoản đầu tiên làm mặc định
        } else {
          setAccountId(""); // Nếu không có tài khoản nào, set accountId rỗng
        }
      } catch (err) {
        setError("Không thể tải danh sách tài khoản.");
        setAccounts([]); // Đảm bảo accounts là mảng rỗng khi có lỗi
        setAccountId(""); // Reset accountId khi có lỗi
      } finally {
        setIsLoading(false); // Kết thúc loading
      }
    };

    fetchAccountsData();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return; // Chỉ validate khi modal đang mở

    const insufficientFundsError =
      "Số tiền nạp lớn hơn số dư hiện có trong tài khoản.";
    const numericAmount = parseFloat(amount);

    // Điều kiện để thực hiện kiểm tra số dư
    if (accountId && accounts && accounts.length > 0 && numericAmount > 0) {
      const selectedAccount = accounts.find((acc) => acc.id === accountId); // Sử dụng .id
      if (selectedAccount) {
        if (numericAmount > selectedAccount.balance) {
          setError(insufficientFundsError); // Set lỗi cụ thể
        } else {
          // Số tiền hợp lệ. Nếu lỗi hiện tại là lỗi không đủ tiền thì xóa nó.
          if (error === insufficientFundsError) {
            setError("");
          }
        }
      } else {
        // Không tìm thấy tài khoản đã chọn (trường hợp hiếm)
        if (error === insufficientFundsError) {
          setError("");
        }
      }
    } else {
      // Các điều kiện kiểm tra số dư chưa được đáp ứng (chưa nhập số tiền, chưa chọn tài khoản,...)
      // Nếu lỗi hiện tại là lỗi không đủ tiền thì xóa nó.
      if (error === insufficientFundsError) {
        setError("");
      }
    }
    // Phụ thuộc vào amount, accountId, accounts để kiểm tra lại khi chúng thay đổi.
    // Phụ thuộc `error` để có thể xóa lỗi một cách có điều kiện.
    // Phụ thuộc `isOpen` để đảm bảo không chạy khi modal đóng.
  }, [amount, accountId, accounts, isOpen, error]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra lỗi validation "Số tiền nạp lớn hơn số dư..." trước
    if (error === "Số tiền nạp lớn hơn số dư hiện có trong tài khoản.") {
      return;
    }

    // Check các trường hợp cơ bản khác
    if (!amount || parseFloat(amount) <= 0 || !accountId) {
      setError("Vui lòng nhập số tiền và chọn tài khoản.");
      return;
    }

    setIsLoading(true);
    const payload = {
      amount: parseFloat(amount),
      accountId: accountId,
    };
    const token = localStorage.getItem("token");

    try {
      await axios.post(
        `http://localhost:5000/api/goals/${goalData._id}/add-funds`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSubmitSuccess();
      onClose();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Lỗi khi nạp tiền.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setAmount(value);
  };

  if (!isOpen) return null;

  const displayAmount = amount
    ? parseInt(amount, 10).toLocaleString("vi-VN")
    : "";

  const accountOptions = accounts.map((acc) => ({
    value: acc.id, // Sử dụng .id
    label: acc.name,
    balance: acc.balance,
  }));

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Nạp tiền cho mục tiêu</h2>
          <p className={styles.modalSubtitle}>"{goalData.name}"</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <p className={styles.errorMessage}>{error}</p>}

          {/* ✅ ĐÂY LÀ PHẦN BỊ THIẾU TRONG FILE CỦA BẠN */}
          <div className={styles.formGroup}>
            <label htmlFor="fund-amount" className={styles.formLabel}>
              Số tiền cần nạp <span className={styles.requiredStar}>*</span>
            </label>
            <div className={styles.amountInputWrapper}>
              <input
                id="fund-amount"
                type="text"
                inputMode="numeric"
                value={displayAmount}
                onChange={handleAmountChange}
                className={styles.amountInput}
                placeholder="0"
                required
                autoFocus
              />
              <span className={styles.currencySymbol}>₫</span>
            </div>
          </div>
          {/* KẾT THÚC PHẦN BỊ THIẾU */}

          <div className={styles.formGroup}>
            <label htmlFor="account-source" className={styles.formLabel}>
              Từ tài khoản <span className={styles.requiredStar}>*</span>
            </label>
            <Select
              id="account-source"
              options={accountOptions}
              value={accountOptions.find((opt) => opt.value === accountId)}
              onChange={(selectedOption) => setAccountId(selectedOption.value)}
              components={{ Option: CustomOption }}
              styles={{
                control: (base) => ({
                  ...base,
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  padding: "0.2rem",
                  boxShadow: "none",
                  "&:hover": { borderColor: "#a5b4fc" },
                }),
                singleValue: (base, state) => ({
                  ...base,
                  display: "flex",
                  alignItems: "center",
                }),
              }}
              getOptionLabel={(option) => (
                <div className={styles.selectedOption}>
                  <span className={styles.optionName}>{option.label}</span>
                  <span className={styles.optionBalanceSmall}>
                    {option.balance.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              )}
              isDisabled={isLoading || accounts.length === 0}
              placeholder="Chọn tài khoản..."
              noOptionsMessage={() => "Không có tài khoản"}
            />
          </div>
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.formButton} ${styles.cancelButton}`}
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`${styles.formButton} ${styles.submitButton}`}
              disabled={isLoading || !!error} // Giữ nguyên logic disable này
            >
              {isLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                "Xác nhận"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
