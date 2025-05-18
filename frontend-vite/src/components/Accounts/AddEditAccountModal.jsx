// src/components/Accounts/AddEditAccountModal.jsx
import React, { useState, useEffect } from "react";
import styles from "./AddEditAccountModal.module.css"; // Tạo file CSS riêng
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

const AddEditAccountModal = ({
  isOpen,
  mode, // 'add' hoặc 'edit'
  initialData,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("bank"); // Mặc định là 'bank'
  const [balance, setBalance] = useState(""); // Số dư ban đầu
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setName(initialData.name || "");
        setType(initialData.type || "bank");
        setBalance(
          initialData.balance !== undefined ? String(initialData.balance) : ""
        );
        setBankName(initialData.bankName || "");
        setAccountNumber(initialData.accountNumber || "");
        setError("");
      } else if (mode === "add") {
        setName("");
        setType("bank"); // Mặc định khi thêm mới
        setBalance("");
        setBankName("");
        setAccountNumber("");
        setError("");
      }
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
    const balanceValue = parseFloat(balance);
    if (mode === "add" && (isNaN(balanceValue) || balance.trim() === "")) {
      setError("Số dư ban đầu không hợp lệ.");
      return;
    }
    // Kiểm tra thêm cho bank nếu cần
    if (type === "bank" && !bankName.trim() && !accountNumber.trim()) {
      // Có thể cho phép một trong hai, hoặc cả hai đều trống tùy logic
      // setError('Tên ngân hàng hoặc số tài khoản cần được cung cấp cho loại Ngân hàng/Thẻ.');
      // return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await onSubmit({
        id: initialData?.id,
        name: name.trim(),
        type,
        balance:
          balance.trim() === ""
            ? mode === "edit"
              ? initialData.balance
              : 0
            : balanceValue, // Nếu sửa mà không đổi balance thì giữ nguyên, nếu thêm mà trống thì là 0
        bankName: type === "bank" ? bankName.trim() : undefined,
        accountNumber: type === "bank" ? accountNumber.trim() : undefined,
      });
    } catch (apiError) {
      console.error("Lỗi khi submit form account:", apiError);
      setError(apiError.message || "Có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  const modalTitle = mode === "add" ? "Thêm Nguồn Tiền Mới" : "Sửa Nguồn Tiền";
  const submitButtonText = mode === "add" ? "Thêm Nguồn Tiền" : "Lưu Thay Đổi";

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{modalTitle}</h2>
          <button
            onClick={handleClose}
            className={styles.closeButton}
            aria-label="Đóng modal"
          >
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                  className={styles.radioInput}
                />
                Ngân hàng/Thẻ
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="initialBalance" className={styles.formLabel}>
              Số dư {mode === "add" ? "ban đầu" : ""}{" "}
              {mode === "add" && <span className={styles.requiredStar}>*</span>}
            </label>
            <input
              type="number"
              id="initialBalance"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className={styles.formInput}
              placeholder="0"
              disabled={isSubmitting}
              step="1000" // Cho phép nhập số tiền chẵn
            />
            {mode === "edit" && (
              <p className={styles.formHint}>
                Để trống nếu không muốn thay đổi số dư hiện tại.
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
              onClick={handleClose}
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
              {isSubmitting && (
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  style={{ marginRight: "8px" }}
                />
              )}
              {submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditAccountModal;

// Và CSS cho nó (`AddEditAccountModal.module.css`) sẽ tương tự như `AddEditCategoryModal.module.css` bạn đã có, chỉ cần điều chỉnh tên class nếu mu
