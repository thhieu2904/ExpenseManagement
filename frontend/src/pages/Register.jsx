import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import "../styles/register.css";
import logo from "../assets/Logo.png";
import bg from "../assets/login/background.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    password: "",
    confirmPassword: "",
  });

  const isFormValid =
    formData.username &&
    formData.fullname &&
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
      const { username, fullname, password } = formData;
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          username,
          fullname,
          password,
        }
      );

      setIsSuccess(true);
      setMessage("Đăng ký thành công! Đang chuyển hướng...");

      setTimeout(() => navigate("/login"), 1500); // chuyển sau 1.5 giây
    } catch (err) {
      setIsSuccess(false);
      const msg =
        err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setMessage(msg);
    }
  };

  return (
    <div
      className="register-container"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="register-left">
        <img src={logo} alt="logo" className="register-logo" />
        <h1 className="register-title">EXPENSE MANAGEMENT</h1>
        <p className="register-desc">
          Tạo tài khoản để bắt đầu quản lí thông minh cùng EMG
        </p>
      </div>

      <form className="register-form-box" onSubmit={handleSubmit}>
        <label htmlFor="username">Tên tài khoản:</label>
        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <label htmlFor="fullname">Họ và tên:</label>
        <input
          id="fullname"
          name="fullname"
          type="text"
          value={formData.fullname}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Nhập mật khẩu:</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <label htmlFor="confirmPassword">Nhập lại mật khẩu:</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
        {message && (
          <div className={`login-message ${isSuccess ? "success" : "error"}`}>
            {message}
          </div>
        )}
        <button
          type="submit"
          className="register-button"
          disabled={!isFormValid}
        >
          <FontAwesomeIcon icon={faUserPlus} />
          &nbsp;Đăng ký
        </button>
      </form>
    </div>
  );
}
