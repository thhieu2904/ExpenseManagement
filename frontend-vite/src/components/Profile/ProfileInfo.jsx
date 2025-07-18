import React, { useState, useRef } from "react";
import styles from "./ProfileInfo.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../../hooks/useTheme";

const ProfileInfo = ({
  user,
  fullname,
  setFullname,
  message,
  isSubmitting,
  handleUpdateProfile,
  handleAvatarChange,
  fileInputRef,
  email,
  setEmail,
  getAvatarUrl,
  // Thêm props cho dark mode toggle
  darkMode,
  setDarkMode,
}) => {
  const [editField, setEditField] = useState("");
  const emailInputRef = useRef();
  const fullnameInputRef = useRef();
  const { toggleTheme, isDarkMode } = useTheme();

  // Khi bấm icon sửa, focus vào input
  const handleEdit = (field) => {
    setEditField(field);
    setTimeout(() => {
      if (field === "email") emailInputRef.current?.focus();
      if (field === "fullname") fullnameInputRef.current?.focus();
    }, 100);
  };

  // Khi blur input, tắt chế độ edit
  const handleBlur = () => setEditField("");

  // Handle dark mode toggle
  const handleDarkModeToggle = () => {
    toggleTheme();
    // Sync với parent component nếu cần
    if (setDarkMode) {
      setDarkMode(!isDarkMode);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.avatarSection}>
        <img
          src={getAvatarUrl(user.avatar)}
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
        <button
          onClick={() => fileInputRef.current.click()}
          className={styles.changeAvatarBtn}
        >
          Đổi ảnh đại diện
        </button>
      </div>

      <form
        onSubmit={handleUpdateProfile}
        className={styles.formSection}
        style={{ minHeight: "100%" }}
      >
        {message.text && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}
        <div className={styles.formGroup}>
          <label>Tên tài khoản</label>
          <input type="text" value={user.username} disabled />
        </div>
        <div className={styles.formGroup}>
          <label>Email</label>
          <div className={styles.inputWithIcon}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={editField !== "email"}
              ref={emailInputRef}
              onBlur={handleBlur}
            />
            <FontAwesomeIcon
              icon={faPen}
              className={styles.editIcon}
              onClick={() => handleEdit("email")}
            />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label>Họ và Tên</label>
          <div className={styles.inputWithIcon}>
            <input
              type="text"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              disabled={editField !== "fullname"}
              ref={fullnameInputRef}
              onBlur={handleBlur}
            />
            <FontAwesomeIcon
              icon={faPen}
              className={styles.editIcon}
              onClick={() => handleEdit("fullname")}
            />
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className={styles.formGroup}>
          <label>Chế độ tối (Dark Mode)</label>
          <div className={styles.toggleContainer}>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                className={styles.toggleInput}
                checked={isDarkMode}
                onChange={handleDarkModeToggle}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.saveButton}
        >
          {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </div>
  );
};

export default ProfileInfo;
