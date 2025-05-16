import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import logo from "../assets/Logo.png";
import bg from "../assets/login/background.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignInAlt } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData
      );
      const { token, account } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(account));
      setIsSuccess(true);
      setMessage("Đăng nhập thành công! Đang chuyển hướng...");
      setTimeout(() => navigate("/home"), 1500);
    } catch (err) {
      setIsSuccess(false);
      setMessage("Đăng nhập thất bại! Vui lòng kiểm tra lại thông tin.");
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
          Đăng nhập để bắt đầu quản lí thông minh cùng EMG
        </p>
      </div>

      <form className="register-form-box" onSubmit={handleLogin}>
        {message && (
          <div className={`login-message ${isSuccess ? "success" : "error"}`}>
            {message}
          </div>
        )}

        <label htmlFor="username">Tên tài khoản:</label>
        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Mật khẩu:</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit" className="register-button">
          <FontAwesomeIcon icon={faSignInAlt} />
          &nbsp;Đăng nhập
        </button>

        <p className="login-bottom">
          <span onClick={() => navigate("/register")}>
            Bạn chưa có tài khoản?
          </span>
        </p>
      </form>
    </div>
  );
}
