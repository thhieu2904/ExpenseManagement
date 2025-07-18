import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Header.module.css";
import logoSrc from "../../assets/login/logo2.png";
import avatar1 from "../../assets/avatars/cat1.png";
import avatar2 from "../../assets/avatars/cat2.png";
import avatar3 from "../../assets/avatars/cat3.png";
import { getAvatarUrl } from "../../api/profileService";

const animalAvatars = [avatar1, avatar2, avatar3];

const Header = () => {
  const [userInfo, setUserInfo] = useState({ fullname: "User", avatar: "" });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUserInfo(JSON.parse(storedUser));
      } catch (err) {
        console.error("Lỗi đọc user:", err);
      }
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const fallbackAvatar = useMemo(() => {
    const index = Math.floor(Math.random() * animalAvatars.length);
    return animalAvatars[index];
  }, []);

  // Sửa logic để avatar có thể là đường dẫn từ server
  const finalAvatar = userInfo.avatar
    ? getAvatarUrl(userInfo.avatar)
    : fallbackAvatar;

  return (
    <header className={styles.headerContainer}>
      <div className={styles.logoContainer}>
        <img src={logoSrc} alt="Logo" className={styles.logo} />
      </div>
      <div className={styles.userSection}>
        <div className={styles.notificationIcon}>
          {/* ... SVG chuông thông báo ... */}
        </div>
        <div
          className={styles.userInfo}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          ref={dropdownRef}
        >
          <img
            src={finalAvatar}
            alt={`${userInfo.fullname}'s avatar`}
            className={styles.avatar}
          />
          <span className={styles.userName}>{userInfo.fullname}</span>
          {isDropdownOpen && (
            <div className={styles.dropdownMenu}>
              <Link to="/profile" className={styles.dropdownItem}>
                Trang cá nhân
              </Link>
              <div onClick={handleLogout} className={styles.dropdownItem}>
                Đăng xuất
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
