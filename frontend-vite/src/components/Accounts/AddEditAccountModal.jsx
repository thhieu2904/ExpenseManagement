// src/components/Accounts/AddEditAccountModal.jsx
import React, { useState, useEffect } from "react";
import styles from "./AddEditAccountModal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

const AddEditAccountModal = ({
  isOpen,
  mode,
  initialData,
  onClose,
  onSubmit,
}) => {
  // State cho các trường trong form
  const [name, setName] = useState("");
  const [type, setType] = useState("bank"); // Mặc định là 'bank'
  const [balance, setBalance] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setName(initialData.name || "");
        // API trả về 'TIENMAT' hoặc 'THENGANHANG'
        setType(initialData.type === "TIENMAT" ? "cash" : "bank");
        setBalance(
          initialData.balance !== undefined ? String(initialData.balance) : ""
        );
        setBankName(initialData.bankName || "");
        setAccountNumber(initialData.accountNumber || "");
      } else {
        // Chế độ 'add'
        setName("");
        setType("bank");
        setBalance("");
        setBankName("");
        setAccountNumber("");
      }
      setError("");
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Tên nguồn tiền không được để trống.");
      return;
    }
    if (mode === "add" && balance.trim() === "") {
      setError("Số dư ban đầu không được để trống.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      // Gửi object đầy đủ thông tin lên component cha
      await onSubmit({
        id: initialData?.id,
        name: name.trim(),
        type,
        balance: balance, // Gửi balance dưới dạng chuỗi, cha sẽ parse
        bankName: type === "bank" ? bankName.trim() : "",
        accountNumber: type === "bank" ? accountNumber.trim() : "",
      });
    } catch (apiError) {
      setError(apiError.message || "Có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {mode === "add" ? "Thêm Nguồn Tiền Mới" : "Sửa Nguồn Tiền"}
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
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="accountType"
                  value="cash"
                  checked={type === "cash"}
                  onChange={(e) => setType(e.target.value)}
                  disabled={isSubmitting || mode === "edit"}
                  className={styles.radioInput}
                />
                Tiền mặt
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="accountType"
                  value="bank"
                  checked={type === "bank"}
                  onChange={(e) => setType(e.target.value)}
                  disabled={isSubmitting || mode === "edit"}
                  className={styles.radioInput}
                />
                Ngân hàng/Thẻ
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="initialBalance" className={styles.formLabel}>
              Số dư {mode === "add" ? "ban đầu" : ""}
              {mode === "add" && <span className={styles.requiredStar}>*</span>}
            </label>
            <input
              type="number"
              id="initialBalance"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className={styles.formInput}
              placeholder="0"
              disabled={isSubmitting || mode === "edit"}
              step="1000"
            />
            {mode === "edit" && (
              <p className={styles.formHint}>
                Số dư chỉ có thể thay đổi thông qua giao dịch.
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

          <hr className={styles.formDivider} />

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
