import React from 'react';
import '../styles/welcome.css';
import logo from '../assets/Logo.png';
import bg from '../assets/Giao_dien_dang_nhap/imgbackground.png';
import nutDangKy from '../assets/Giao_dien_dang_nhap/nut_dang_ky.png';
import nutDangNhap from '../assets/Giao_dien_dang_nhap/nut_dang_nhap.png';
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

return (
  <div
    className="welcome-container"
    style={{ backgroundImage: `url(${bg})` }}
  >
    <img src={logo} alt="logo" className="welcome-logo" />
    <h1 className="welcome-title">Chào mừng đến với EMG</h1>
    <p className="welcome-desc">
  Trải nghiệm ứng dụng giúp bạn theo dõi, phân tích và giúp quản lí tài chính hiệu quả
    </p>

    <div className="welcome-btn-group">
      <img
        src={nutDangKy}
        alt="Đăng ký"
        className="welcome-button-img"
        onClick={() => navigate('/register')}
      />
      <img
        src={nutDangNhap}
        alt="Đăng nhập"
        className="welcome-button-img"
        onClick={() => navigate('/login')}
      />
    </div>
    </div>
  );
}
