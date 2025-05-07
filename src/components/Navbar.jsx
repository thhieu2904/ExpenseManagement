import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/Logo.png';
import avatar from '../assets/avatar.png'; // ảnh người dùng
import { Bell } from 'lucide-react'; // hoặc FontAwesome nếu anh không dùng Lucide

import './Navbar.css';

export default function Navbar() {
  return (
    <div className="navbar-wrapper">
      <div className="navbar-top">
        <div className="navbar-logo">
          <img src={logo} alt="Logo" />
          <span>EXPENSE MANAGEMENT</span>
        </div>
        <div className="navbar-user">
          <Bell className="navbar-icon" />
          <img src={avatar} alt="Avatar" className="navbar-avatar" />
          <span className="navbar-username">Nguyễn Văn A</span>
        </div>
      </div>

      <div className="navbar-menu">
        <Link to="/">Trang chủ</Link>
        <Link to="/danh-muc">Danh mục</Link>
        <Link to="/tai-khoan">Tài khoản</Link>
        <Link to="/muc-tieu">Mục tiêu</Link>
        <Link to="/ngan-sach">Ngân sách</Link>
        <Link to="/giao-dich">Giao dịch</Link>
        <Link to="/thong-ke">Thống kê</Link>
      </div>
    </div>
  );
}
