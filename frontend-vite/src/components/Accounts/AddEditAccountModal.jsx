import React, { useState, useEffect } from "react";
import styles from "./AddEditAccountModal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// ✅ THAY ĐỔI 1: Import các icon cần thiết
import {
  faSpinner,
  faWallet,
  faLandmark,
} from "@fortawesome/free-solid-svg-icons";

const AddEditAccountModal = ({
  isOpen,
  mode,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("bank");
  const [balance, setBalance] = useState(""); // Sẽ lưu số dạng chuỗi, vd: "1000000"
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setName(initialData.name || "");
        setType(initialData.type === "TIENMAT" ? "cash" : "bank");
        // ✅ THAY ĐỔI 2: Chuyển đổi balance từ số sang chuỗi
        setBalance(
          initialData.balance !== undefined ? String(initialData.balance) : ""
        );
        setBankName(initialData.bankName || "");
        setAccountNumber(initialData.accountNumber || "");
      } else {
        setName("");
        setType("bank");
        setBalance("");
        setBankName("");
        setAccountNumber("");
      }
      setError("");
    }
  }, [isOpen, mode, initialData]);

  // ✅ THAY ĐỔI 3: Thêm hàm xử lý và định dạng cho ô nhập số dư
  const handleBalanceChange = (e) => {
    const inputValue = e.target.value;
    const rawValue = inputValue.replace(/[^0-9]/g, "");
    setBalance(rawValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Tên nguồn tiền không được để trống.");
      return;
    }
    if (mode === "add" && !balance.trim()) {
      setError("Số dư ban đầu không được để trống.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await onSubmit({
        id: initialData?.id,
        name: name.trim(),
        type,
        balance: balance, // Gửi đi chuỗi số thuần
        bankName: type === "bank" ? bankName.trim() : "",
        accountNumber: type === "bank" ? accountNumber.trim() : "",
      });
    } catch (apiError) {
      setError(apiError.message || "Có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // ✅ THAY ĐỔI 4: Tạo giá trị hiển thị đã định dạng cho ô số dư
  const displayBalance = balance
    ? parseInt(balance, 10).toLocaleString("vi-VN")
    : "";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {mode === "add" ? "Thêm Nguồn Tiền" : "Sửa Nguồn Tiền"}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.accountForm}>
          {error && <p className={styles.errorMessage}>{error}</p>}

          <div className={styles.formGroup}>
            <label htmlFor="accountName" className={styles.formLabel}>
              Tên nguồn tiền <span className={styles.requiredStar}>*</span>
            </label>
            <input
              type="text"
              id="accountName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.formInput}
              placeholder="Ví dụ: Ví cá nhân, Tài khoản Techcombank"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Loại <span className={styles.requiredStar}>*</span>
            </label>
            {/* ✅ THAY ĐỔI 5: Cập nhật cấu trúc radio button */}
            <div className={styles.radioGroup}>
              <label>
                <input
                  type="radio"
                  name="accountType"
                  value="cash"
                  checked={type === "cash"}
                  onChange={(e) => setType(e.target.value)}
                  disabled={isSubmitting || mode === "edit"}
                  className={styles.radioInput}
                />
                <span className={`${styles.radioLabelText} ${styles.cash}`}>
                  <FontAwesomeIcon
                    icon={faWallet}
                    className={styles.radioIcon}
                  />
                  Tiền mặt
                </span>
              </label>
              <label>
                <input
                  type="radio"
                  name="accountType"
                  value="bank"
                  checked={type === "bank"}
                  onChange={(e) => setType(e.target.value)}
                  disabled={isSubmitting || mode === "edit"}
                  className={styles.radioInput}
                />
                <span className={`${styles.radioLabelText} ${styles.bank}`}>
                  <FontAwesomeIcon
                    icon={faLandmark}
                    className={styles.radioIcon}
                  />
                  Ngân hàng/Thẻ
                </span>
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="initialBalance" className={styles.formLabel}>
              Số dư {mode === "add" ? "ban đầu" : ""}
              {mode === "add" && <span className={styles.requiredStar}>*</span>}
            </label>
            {/* ✅ THAY ĐỔI 6: Cập nhật ô nhập số dư */}
            <div className={styles.balanceInputWrapper}>
              <input
                type="text"
                inputMode="numeric"
                id="initialBalance"
                value={displayBalance}
                onChange={handleBalanceChange}
                className={styles.balanceInput}
                placeholder="0"
                disabled={isSubmitting || mode === "edit"}
              />
              <span className={styles.currencySymbol}>₫</span>
            </div>
            {mode === "edit" && (
              <p className={styles.formHint}>
                Số dư được cập nhật tự động qua các giao dịch.
              </p>
            )}
          </div>

          {type === "bank" && (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="bankName" className={styles.formLabel}>
                  Tên ngân hàng
                </label>
                <input
                  type="text"
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className={styles.formInput}
                  placeholder="Ví dụ: BIDV, Techcombank"
                  disabled={isSubmitting}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="accountNumber" className={styles.formLabel}>
                  Số tài khoản
                </label>
                <input
                  type="text"
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className={styles.formInput}
                  placeholder="Ví dụ: 123456789"
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`${styles.formButton} ${styles.cancelButton}`}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.formButton} ${styles.submitButton}`}
            >
              {isSubmitting ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : mode === "add" ? (
                "Thêm Nguồn Tiền"
              ) : (
                "Lưu Thay Đổi"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditAccountModal;
