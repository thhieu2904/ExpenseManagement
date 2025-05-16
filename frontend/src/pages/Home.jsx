import React from 'react';
import '../styles/home.css';
import Navbar from '../components/Navbar';
import addTransactionBtn from '../assets/ten_anh_cua_anh.png'; // sửa lại tên file đúng

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="home-content">
        <div classname ="Tieu_de">
          <img src="../assets/Trang_chu/Icon.png" alt="chart icon" className="section-icon" />
          <div className="home-title">Tổng quan chi tiêu</div>
          <div className="home-desc">Chào mừng bạn đến với EMG</div>
        </div>
      </div>
    </>
  );
}
