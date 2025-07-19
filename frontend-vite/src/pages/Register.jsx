import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api/authService";

import styles from "../styles/Register.module.css";
import logo from "../assets/login/logo.png";
import bg from "../assets/login/background.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const isFormValid =
    formData.username &&
    formData.fullname &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { username, fullname, email, password } = formData;
      const response = await register({ username, fullname, email, password });
      setIsSuccess(true);
      setMessage(
        response.data.message || "Đăng ký thành công! Đang chuyển hướng..."
      );
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setIsSuccess(false);
      const msg =
        err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setMessage(msg);
    }
  };

  return (
    <div
      className={styles["register-container"]}
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className={styles["register-left"]}>
        <img src={logo} alt="logo" className={styles["register-logo"]} />
        <h1 className={styles["register-title"]}>EXPENSE MANAGEMENT</h1>
        <p className={styles["register-desc"]}>
          Tạo tài khoản để bắt đầu quản lí thông minh cùng EMG
        </p>
      </div>

      <form className={styles["register-form-box"]} onSubmit={handleSubmit}>
        <label htmlFor="username">Tên tài khoản:</label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="Nhập tên tài khoản"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <label htmlFor="fullname">Họ và tên:</label>
        <input
          id="fullname"
          name="fullname"
          type="text"
          placeholder="Nhập họ và tên đầy đủ"
          value={formData.fullname}
          onChange={handleChange}
          required
        />

        <label htmlFor="email">Email:</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="example@email.com"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Nhập mật khẩu:</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Nhập mật khẩu mạnh"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <label htmlFor="confirmPassword">Nhập lại mật khẩu:</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Nhập lại mật khẩu"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />

        {message && (
          <div
            className={`${styles["login-message"]} ${
              isSuccess ? styles["success"] : styles["error"]
            }`}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          className={styles["register-button"]}
          disabled={!isFormValid}
        >
          <FontAwesomeIcon icon={faUserPlus} />
          &nbsp;Đăng ký
        </button>
        <div className={styles["register-login-link"]}>
          Đã có tài khoản?
          <span
            className={styles["login-link"]}
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </span>
        </div>
      </form>
    </div>
  );
}
