import React from "react";
import ConfirmDialog from "../Common/ConfirmDialog";
import styles from "./SecuritySettings.module.css";

const SecuritySettings = ({
  passwords,
  setPasswords,
  message,
  isSubmitting,
  loginHistory,
  isConfirmOpen,
  setIsConfirmOpen,
  handlePasswordSubmit,
  handleChange,
  handleDeleteAccount,
}) => {
  return (
    <>
      <div className={styles.securityGrid}>
        {/* Hàng trên: 2 card */}
        <div className={styles.securityRow}>
          <div className={styles.securityCard}>
            <h3>Đổi mật khẩu</h3>
            <form onSubmit={handlePasswordSubmit}>
              {message.text && (
                <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>
              )}
              <div className={styles.formGroup}>
                <label>Mật khẩu cũ</label>
                <input type="password" name="oldPassword" value={passwords.oldPassword} onChange={handleChange} required />
              </div>
              <div className={styles.formGroup}>
                <label>Mật khẩu mới</label>
                <input type="password" name="newPassword" value={passwords.newPassword} onChange={handleChange} required />
              </div>
              <div className={styles.formGroup}>
                <label>Xác nhận mật khẩu mới</label>
                <input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handleChange} required />
              </div>
              <button type="submit" disabled={isSubmitting} className={styles.saveButton}>
                {isSubmitting ? "Đang lưu..." : "Lưu mật khẩu"}
              </button>
            </form>
          </div>
          <div className={styles.securityCard}>
            <h3>Lịch sử đăng nhập</h3>
            <ul className={styles.historyList}>
              {loginHistory.length === 0 && <li>Chưa có dữ liệu.</li>}
              {loginHistory.map(entry => (
                <li key={entry._id} className={styles.historyItem}>
                  <div className={styles.historyInfo}>
                    <strong>{entry.userAgent.substring(0, 50)}...</strong>
                    <span>IP: {entry.ipAddress}</span>
                  </div>
                  <span className={styles.historyTime}>
                    {new Date(entry.timestamp).toLocaleString('vi-VN')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Hàng dưới: Vùng nguy hiểm */}
        <div className={styles.securityRow}>
          <div className={styles.securityCardDanger}>
            <h3>Vùng nguy hiểm</h3>
            <div className={styles.dangerZone}>
              <div>
                <strong>Xóa tài khoản này</strong>
                <p>Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu.</p>
              </div>
              <button onClick={() => setIsConfirmOpen(true)} className={styles.dangerButton}>
                Xóa tài khoản
              </button>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Xác nhận xóa tài khoản"
        message="Bạn có chắc chắn muốn xóa tài khoản của mình không? Toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục."
      />
    </>
  );
};

export default SecuritySettings;