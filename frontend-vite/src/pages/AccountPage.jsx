// src/pages/AccountPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import AccountPageHeader from "../components/Accounts/AccountPageHeader";
import TotalBalanceDisplay from "../components/Accounts/TotalBalanceDisplay";
import AccountList from "../components/Accounts/AccountList";
import AddEditAccountModal from "../components/Accounts/AddEditAccountModal";

import styles from "../styles/AccountPage.module.css";

const AccountPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchAccountsData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập.");
      const response = await axios.get("http://localhost:5000/api/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Chỉ cần gán trực tiếp dữ liệu từ API
      setAccounts(response.data || []);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccountsData();
  }, [refreshTrigger, fetchAccountsData]);

  const handleForceRefresh = () => setRefreshTrigger((prev) => prev + 1);

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
        <AccountPageHeader onAddAccountClick={handleOpenAddModal} />
        <div className={styles.mainContent}>
          <div className={styles.leftColumn}>
            <TotalBalanceDisplay accounts={accounts} isLoading={isLoading} />
          </div>
          <div className={styles.rightColumn}>
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
