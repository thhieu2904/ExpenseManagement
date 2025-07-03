import React from "react";
import styles from "./ProfileInfo.module.css";

const ProfileInfo = ({
  user,
  fullname,
  setFullname,
  message,
  isSubmitting,
  handleUpdateProfile,
  handleAvatarChange,
  fileInputRef,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.avatarSection}>
        <img
          src={
            user.avatar
              ? `http://localhost:5000${user.avatar}`
              : "/default-avatar.png"
          }
          alt="Avatar"
          className={styles.avatar}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarChange}
          style={{ display: "none" }}
          accept="image/*"
        />
        <button onClick={() => fileInputRef.current.click()} className={styles.changeAvatarBtn}>
          Đổi ảnh đại diện
        </button>
      </div>

      <form onSubmit={handleUpdateProfile} className={styles.formSection}>
        {message.text && (
          <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>
        )}
        <div className={styles.formGroup}>
          <label>Tên tài khoản</label>
          <input type="text" value={user.username} disabled />
        </div>
        <div className={styles.formGroup}>
          <label>Họ và Tên</label>
          <input
            type="text"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
          />
        </div>
        <button type="submit" disabled={isSubmitting} className={styles.saveButton}>
          {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </div>
  );
};

export default ProfileInfo;