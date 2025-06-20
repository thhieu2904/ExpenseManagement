// Mở và THAY THẾ file: frontend-vite/src/pages/HomePage.jsx

import React, { useState, useEffect } from "react";
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import StatsOverview from "../components/StatsOverview/StatsOverview";
import DetailedAnalyticsSection from "../components/DetailedAnalyticsSection/DetailedAnalyticsSection";
import RecentTransactions from "../components/RecentTransactions/RecentTransactions";
import Footer from "../components/Footer/Footer";
import { getStatsOverview } from "../api/homePageService";

const HomePage = () => {
  // State cho thông tin người dùng
  const [userData, setUserData] = useState({ name: "", avatarUrl: null });

  // State cho StatsOverview
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

  // Fetch dữ liệu cho StatsOverview
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setIsLoadingStats(false);
          return;
        }
        const response = await getStatsOverview(token);
        setStatsData(response.data);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu tổng quan cho HomePage:", err);
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <Header userName={userData.name} userAvatar={userData.avatarUrl} />
      <Navbar />
      <main style={{ padding: "20px" }}>
        <StatsOverview stats={statsData} loading={isLoadingStats} />

        <DetailedAnalyticsSection />

        <RecentTransactions />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
