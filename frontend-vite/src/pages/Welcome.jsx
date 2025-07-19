import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Welcome.module.css"; // ✅ đúng module

import logo from "../assets/login/logo.png";
import btnRegister from "../assets/login/btn_dangky.png";
import btnLogin from "../assets/login/btn_dangnhap.png";

export default function Welcome() {
  const navigate = useNavigate();
  return (
    <div className={styles["welcome-container"]}>
      <img src={logo} alt="Logo EMG" className={styles["welcome-logo"]} />

      <h1 className={styles["welcome-title"]}>Chào mừng đến với EMG</h1>
      <p className={styles["welcome-desc"]}>
        Trải nghiệm ứng dụng quản lý chi tiêu thông minh và tiện lợi
      </p>

      <div className={styles["welcome-btn-group"]}>
        <img
          src={btnRegister}
          alt="Đăng ký"
          className={styles["welcome-button-img"]}
          onClick={() => navigate("/register")}
        />
        <img
          src={btnLogin}
          alt="Đăng nhập"
          className={styles["welcome-button-img"]}
          onClick={() => navigate("/login")}
        />
      </div>
    </div>
  );
}
