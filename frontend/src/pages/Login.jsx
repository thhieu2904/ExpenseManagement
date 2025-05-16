import React from 'react';
import '../styles/login.css';
import logo from '../assets/Logo.png';
import bg from '../assets/Giao_dien_dang_nhap/imgbackground.png';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  return (
    <div
      className="login-container"
      style={{ backgroundImage: `url(${bg})` }}
    >
        <div className="login-left">
          <img src={logo} alt="logo" className="login-logo" />
          <p className="login-desc">
            Quản lý chi tiêu dễ dàng hơn bao giờ hết cùng EMG
          </p>
        </div>

        <div className="login-form-box">
          <label htmlFor="username">Tên tài khoản:</label>
          <input type="text" id="username" />

          <label htmlFor="password">Mật khẩu:</label>
          <input type="password" id="password" />

          <img
          src={require('../assets/Giao_dien_dang_nhap/nut_dang_nhap.png')}
          alt="Đăng nhập"
          className="login-img-button"
          onClick={() => navigate('/home')}
          />

          <p className="login-bottom">
            <span onClick={() => navigate('/register')}>Bạn chưa có tài khoản</span>
          </p>
      </div>
    </div>
  );
}
