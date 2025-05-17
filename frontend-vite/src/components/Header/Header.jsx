import React, { useMemo } from "react";
import avatar1 from "../../assets/avatars/cat1.png";
import avatar2 from "../../assets/avatars/cat2.png";
import avatar3 from "../../assets/avatars/cat3.png";

import styles from "./Header.module.css";
import logoSrc from "../../assets/login/logo2.png";
const animalAvatars = [avatar1, avatar2, avatar3];

const Header = ({ userName = "Nguyễn Văn A", userAvatar }) => {
  // ✅ Random ảnh 1 lần duy nhất khi avatar trống
  const fallbackAvatar = useMemo(() => {
    const index = Math.floor(Math.random() * animalAvatars.length);
    return animalAvatars[index];
  }, []);

  const finalAvatar = userAvatar?.trim() ? userAvatar : fallbackAvatar;
  return (
    <header className={styles.headerContainer}>
      <div className={styles.logoContainer}>
        <img
          src={logoSrc}
          alt="Expense Management Logo"
          className={styles.logo}
        />
        {/* Nếu muốn thêm text bên cạnh logo */}
        {/* <span className={styles.logoText}>EXPENSE MANAGEMENT</span> */}
      </div>
      <div className={styles.userSection}>
        <div className={styles.notificationIcon}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.bellIcon}
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </div>
        <div className={styles.userInfo}>
          <img
            src={finalAvatar}
            alt={`${userName}'s avatar`}
            className={styles.avatar}
          />
          <span className={styles.userName}>{userName}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
