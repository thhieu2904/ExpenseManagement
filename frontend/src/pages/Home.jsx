import React from "react";
import "../styles/home.css";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="home-content">
        <div classname="Tieu_de">
          <img
            src="../assets/Logo.png"
            alt="chart icon"
            className="section-icon"
          />
          <div className="home-title">Tổng quan chi tiêu</div>
          <div className="home-desc">Chào mừng bạn đến với EMG</div>
        </div>
      </div>
    </>
  );
}
