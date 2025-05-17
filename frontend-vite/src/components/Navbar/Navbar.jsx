import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";

const Navbar = () => {
  // Danh sách các mục điều hướng
  // Quan trọng: 'path' phải khớp với các định nghĩa route trong App.jsx của bạn
  const navigationItems = [
    { name: "Trang chủ", path: "/homepage" }, // Hoặc '/' nếu bạn muốn trang chủ là root
    { name: "Danh mục", path: "/categories" },
    { name: "Tài khoản", path: "/accounts" },
    { name: "Mục tiêu", path: "/goals" },
    { name: "Ngân sách", path: "/budgets" },
    { name: "Giao dịch", path: "/transactions" },
    { name: "Thống kê", path: "/statistics" },
    { name: "Cá nhân", path: "/PersonInfo" },
  ];

  return (
    <nav className={styles.navbarContainer}>
      <ul className={styles.navList}>
        {navigationItems.map((item) => (
          <li key={item.name} className={styles.navItem}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              {item.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
