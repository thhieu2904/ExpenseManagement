// src/pages/AccountPage.jsx
import React, { useState, useCallback } from "react";
import Header from "../components/Header/Header"; // Hoặc dùng AppLayout
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

// import AccountPageHeader from '../components/Accounts/AccountPageHeader'; // Sẽ tạo sau
import AccountList from "../components/Accounts/AccountList";
import AddEditAccountModal from "../components/Accounts/AddEditAccountModal"; // Sẽ tạo sau
import TotalBalanceDisplay from "../components/Accounts/TotalBalanceDisplay";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // Cho nút Thêm
import { faPlus, faUniversity } from "@fortawesome/free-solid-svg-icons"; // faUniversity cho icon chính

const AccountPageHeader = ({ onAddAccountClick }) => {
  // Header đơn giản
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 25px",
        backgroundColor: "#f4f6f8",
        borderRadius: "8px",
        marginBottom: "20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <FontAwesomeIcon
          icon={faUniversity}
          style={{ fontSize: "1.8rem", color: "#555" }}
        />
        <h2
          style={{
            fontSize: "1.8rem",
            color: "#2c3e50",
            fontWeight: 600,
            margin: 0,
          }}
        >
          Quản lí nguồn tiền
        </h2>
      </div>
      <button
        onClick={onAddAccountClick}
        style={{
          backgroundColor: "#3f51b5",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "6px",
          fontSize: "0.95rem",
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <FontAwesomeIcon icon={faPlus} /> Thêm nguồn tiền
      </button>
    </div>
  );
};

const AccountPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [listRefreshTrigger, setListRefreshTrigger] = useState(0); // Để trigger AccountList refresh

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
    // formData: { name, type, balance, accountNumber?, bankName? }
    const token = localStorage.getItem("token");
    const apiUrl = editingAccount
      ? `http://localhost:5000/api/accounts/${editingAccount.id}`
      : "http://localhost:5000/api/accounts";
    const apiMethod = editingAccount ? "put" : "post";

    // Backend có thể yêu cầu balance là số, không phải chuỗi
    const payload = {
      ...formData,
      balance: parseFloat(formData.balance) || 0, // Chuyển balance sang số
    };

    try {
      await axios[apiMethod](apiUrl, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      handleCloseModal();
      setListRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error(
        "Lỗi khi lưu nguồn tiền:",
        error.response?.data?.message || error.message
      );
      throw new Error(
        error.response?.data?.message || "Lỗi không xác định khi lưu."
      );
    }
  };

  return (
    <div>
      <Header />
      <Navbar />
      <div style={{ padding: "20px" }}>
        <AccountPageHeader onAddAccountClick={handleOpenAddModal} />
        <TotalBalanceDisplay refreshTrigger={listRefreshTrigger} />{" "}
        {/* 3. TRUYỀN PROP */}
        <AccountList
          key={listRefreshTrigger}
          onEditAccountRequest={handleOpenEditModal}
        />
      </div>

      {isModalOpen && ( // Render Modal có điều kiện
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
