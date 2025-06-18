// src/pages/AccountPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { startOfMonth, endOfMonth, format } from "date-fns";

import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import AccountPageHeader from "../components/Accounts/AccountPageHeader";
import DateRangeNavigator from "../components/Common/DateRangeNavigator"; // ✅ 1. Import component mới
import TotalBalanceDisplay from "../components/Accounts/TotalBalanceDisplay";
import AccountList from "../components/Accounts/AccountList";
import AddEditAccountModal from "../components/Accounts/AddEditAccountModal";

import styles from "../styles/AccountPage.module.css";

const AccountPage = () => {
  // --- State quản lý chung ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ✅ 2. THAY ĐỔI STATE QUẢN LÝ THỜI GIAN
  // Bỏ state `currentDate` cũ, thay bằng `dateRange`
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
  });
  const [period, setPeriod] = useState("month"); // Thêm state để biết preset nào đang được chọn

  // ✅ 3. CẬP NHẬT HÀM GỌI API
  const fetchAccountsData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập.");

      // Xây dựng params cho API
      const params = {};
      if (dateRange.startDate && dateRange.endDate) {
        // Định dạng ngày thành chuỗi YYYY-MM-DD
        params.startDate = format(dateRange.startDate, "yyyy-MM-dd");
        params.endDate = format(dateRange.endDate, "yyyy-MM-dd");
      }

      const response = await axios.get("http://localhost:5000/api/accounts", {
        headers: { Authorization: `Bearer ${token}` },
        params: params, // Gửi params đi
      });

      setAccounts(response.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Không thể tải dữ liệu nguồn tiền."
      );
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]); // Phụ thuộc vào `dateRange`

  useEffect(() => {
    fetchAccountsData();
  }, [refreshTrigger, fetchAccountsData]);

  const handleForceRefresh = () => setRefreshTrigger((prev) => prev + 1);

  // --- Các hàm xử lý Modal (không đổi) ---
  const handleOpenAddModal = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleFormSubmit = async (formData) => {
    const token = localStorage.getItem("token");
    const isEditing = !!editingAccount;

    const apiUrl = isEditing
      ? `http://localhost:5000/api/accounts/${editingAccount.id}`
      : "http://localhost:5000/api/accounts";

    const apiMethod = isEditing ? "put" : "post";

    const payload = {
      name: formData.name,
      type: formData.type === "cash" ? "TIENMAT" : "THENGANHANG",
      initialBalance: parseFloat(formData.balance) || 0,
      bankName: formData.bankName,
      accountNumber: formData.accountNumber,
    };

    if (isEditing) {
      delete payload.initialBalance;
      delete payload.type;
    }

    try {
      await axios[apiMethod](apiUrl, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      handleCloseModal();
      handleForceRefresh();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Có lỗi xảy ra khi lưu.";
      console.error("Lỗi khi lưu nguồn tiền:", errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Tính tổng số dư từ danh sách tài khoản đã được API trả về
  const totalBalance = accounts.reduce(
    (sum, acc) => sum + (acc.balance || 0),
    0
  );

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Header />
      <Navbar />
      <main className={styles.pageWrapper}>
        {/* ✅ 4. THAY ĐỔI HEADER */}
        <AccountPageHeader onAddAccountClick={handleOpenAddModal} />

        {/* Thêm component DateRangeNavigator ngay dưới Header */}
        <div style={{ marginTop: "20px", marginBottom: "20px" }}>
          <DateRangeNavigator
            dateRange={dateRange}
            onDateChange={setDateRange}
            period={period}
            onPeriodChange={setPeriod}
          />
        </div>

        <div className={styles.mainContent}>
          <div className={styles.leftColumn}>
            <TotalBalanceDisplay accounts={accounts} isLoading={isLoading} />
          </div>
          <div className={styles.rightColumn}>
            {/* Sửa lại file AccountList để hiển thị thanh activity bar 
                          thay vì progress bar cũ.
                        */}
            <AccountList
              accounts={accounts}
              totalBalance={totalBalance}
              isLoading={isLoading}
              error={error}
              onEditRequest={handleOpenEditModal}
              onDeleteSuccess={handleForceRefresh}
            />
          </div>
        </div>
      </main>
      {isModalOpen && (
        <AddEditAccountModal
          isOpen={isModalOpen}
          mode={editingAccount ? "edit" : "add"}
          initialData={editingAccount}
          onClose={handleCloseModal}
          onSubmit={handleFormSubmit}
        />
      )}
      <Footer />
    </div>
  );
};

export default AccountPage;
