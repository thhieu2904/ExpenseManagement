// src/components/Common/ConfirmDialog.jsx
import React from "react";
import styles from "./ConfirmDialog.module.css";

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3 className={styles.modalTitle}>{title || "Xác nhận"}</h3>
        <p className={styles.modalMessage}>
          {message || "Bạn có chắc chắn muốn thực hiện hành động này?"}
        </p>
        <div className={styles.modalActions}>
          <button
            onClick={onClose}
            className={`${styles.modalButton} ${styles.cancelButton}`}
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            className={`${styles.modalButton} ${styles.confirmButton}`}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
