// Mở và THAY THẾ file: frontend-vite/src/pages/HomePage.jsx

import React, { useState, useEffect } from "react";
import axios from "axios"; // Import axios
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import StatsOverview from "../components/StatsOverview/StatsOverview";
import DetailedAnalyticsSection from "../components/DetailedAnalyticsSection/DetailedAnalyticsSection";
import RecentTransactions from "../components/RecentTransactions/RecentTransactions";
import Footer from "../components/Footer/Footer";

const HomePage = () => {
  // State cho thông tin người dùng
  const [userData, setUserData] = useState({ name: "", avatarUrl: null });

  // ✅ BƯỚC 1: Thêm state để lưu dữ liệu cho StatsOverview
  const [statsData, setStatsData] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // useEffect để lấy thông tin người dùng (giữ nguyên)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const account = JSON.parse(storedUser);
        setUserData({
          name:
            account.username ||
            account.fullName ||
            account.name ||
            "Người dùng",
          avatarUrl: account.avatarUrl || account.profilePicture || null,
        });
      } catch (error) {
        console.error(
          "Lỗi khi parse thông tin người dùng từ localStorage:",
          error
        );
      }
    }
  }, []);

  // ✅ BƯỚC 2: Thêm useEffect để fetch dữ liệu cho StatsOverview
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          // Xử lý trường hợp không có token
          setIsLoadingStats(false);
          return;
        }

        // API này sẽ tự động lấy tháng/năm hiện tại ở backend
        const response = await axios.get(
          "http://localhost:5000/api/statistics/overview",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStatsData(response.data);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu tổng quan cho HomePage:", err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []); // Mảng rỗng để chỉ chạy một lần

  return (
    <div>
      <Header userName={userData.name} userAvatar={userData.avatarUrl} />
      <Navbar />
      <main style={{ padding: "20px" }}>
        {/* ✅ BƯỚC 3: Truyền props xuống cho StatsOverview */}
        <StatsOverview stats={statsData} loading={isLoadingStats} />

        <DetailedAnalyticsSection />
        <RecentTransactions />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
