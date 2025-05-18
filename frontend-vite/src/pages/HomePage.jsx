import React, { useState, useEffect } from "react";
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import StatsOverview from "../components/StatsOverview/StatsOverview";
import DetailedAnalyticsSection from "../components/DetailedAnalyticsSection/DetailedAnalyticsSection";
import RecentTransactions from "../components/RecentTransactions/RecentTransactions";
import Footer from "../components/Footer/Footer";

const HomePage = () => {
  const [userData, setUserData] = useState({ name: "", avatarUrl: null });

  useEffect(() => {
    // Lấy thông tin người dùng từ localStorage khi component được mount
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const account = JSON.parse(storedUser);
        // Giả sử object 'account' có các trường 'username' (hoặc 'fullName', 'name') và 'avatarUrl' (hoặc 'profilePicture')
        // Điều chỉnh các key này cho phù hợp với cấu trúc object 'account' thực tế của bạn
        setUserData({
          name:
            account.username ||
            account.fullName ||
            account.name ||
            "Người dùng", // Ưu tiên các trường phổ biến
          avatarUrl: account.avatarUrl || account.profilePicture || null,
        });
      } catch (error) {
        console.error(
          "Lỗi khi parse thông tin người dùng từ localStorage:",
          error
        );
        // Xử lý lỗi nếu dữ liệu trong localStorage không hợp lệ
      }
    }
  }, []); // Mảng rỗng đảm bảo useEffect chỉ chạy một lần sau khi component mount

  return (
    // <div className={styles.homePageContainer}>
    <div>
      <Header
        userName={userData.name}
        userAvatar={userData.avatarUrl} // Header sẽ dùng avatar mặc định nếu avatarUrl là null
      />
      <Navbar />
      <main
        style={{
          padding: "20px",
          textAlign: "center",
        }}
      >
        <StatsOverview />
        <DetailedAnalyticsSection />
        <RecentTransactions />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
