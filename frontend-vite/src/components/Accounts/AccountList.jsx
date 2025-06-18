// src/components/Accounts/AccountList.jsx
import React, { useState } from "react";
import axios from "axios";
import styles from "./AccountList.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWallet,
  faLandmark,
  faEdit,
  faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
import ConfirmDialog from "../Common/ConfirmDialog";

const formatCurrency = (amount) => {
  if (typeof amount !== "number") return "0 ₫";
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

const formatAccountNumber = (number) => {
  if (!number || number.length <= 4) {
    return number;
  }
  return `•••• ${number.slice(-4)}`;
};

// --- AccountItem Component (Nội bộ) ---
const AccountItem = ({ account, onEdit, onDeleteRequest }) => {
  const accountIcon = account.type === "TIENMAT" ? faWallet : faLandmark;

  // ✅ LOGIC MỚI: Tính toán cho thanh hoạt động
  const totalActivity =
    (account.monthlyIncome || 0) + (account.monthlyExpense || 0);
  const incomePercentage =
    totalActivity > 0
      ? ((account.monthlyIncome || 0) / totalActivity) * 100
      : 0;
  const expensePercentage =
    totalActivity > 0
      ? ((account.monthlyExpense || 0) / totalActivity) * 100
      : 0;

  return (
    <div className={styles.accountItem}>
      {/* Cột 1: Thông tin tài khoản */}
      <div className={styles.accountInfo}>
        <FontAwesomeIcon
          icon={accountIcon}
          className={styles.accountIconItem}
        />
        <div className={styles.accountDetails}>
          <span className={styles.accountName}>{account.name}</span>
          {account.type === "THENGANHANG" &&
            (account.bankName || account.accountNumber) && (
              <span className={styles.accountSubDetail}>
                {account.bankName}
                {account.bankName && account.accountNumber && " - "}
                {formatAccountNumber(account.accountNumber)}
              </span>
            )}
        </div>
      </div>

      {/* ✅ Cột 2: Thanh hoạt động và số liệu thu/chi */}
      <div className={styles.activitySection}>
        <div className={styles.activityBar}>
          <div
            className={styles.incomeBar}
            style={{ width: `${incomePercentage}%` }}
          ></div>
          <div
            className={styles.expenseBar}
            style={{ width: `${expensePercentage}%` }}
          ></div>
        </div>
        <div className={styles.activityFigures}>
          <span className={styles.incomeText}>
            + {formatCurrency(account.monthlyIncome || 0)}
          </span>
          <span className={styles.expenseText}>
            - {formatCurrency(account.monthlyExpense || 0)}
          </span>
        </div>
      </div>

      {/* Cột 3: Số dư cuối và nút hành động */}
      <div className={styles.balanceAndActions}>
        <span className={styles.accountBalance}>
          {formatCurrency(account.balance)}
        </span>
        <div className={styles.accountActions}>
          <button
            onClick={() => onEdit(account)}
            className={`${styles.actionButton} ${styles.editButton}`}
            title="Sửa"
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button
            onClick={() => onDeleteRequest(account.id, account.name)}
            className={`${styles.actionButton} ${styles.deleteButton}`}
            title="Xóa"
          >
            <FontAwesomeIcon icon={faTrashAlt} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- AccountList Component (Phần chính không đổi) ---
const AccountList = ({
  accounts,
  isLoading,
  error,
  onEditRequest,
  onDeleteSuccess,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  const requestDeleteAccount = (accountId, accountName) => {
    setAccountToDelete({ id: accountId, name: accountName });
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/accounts/${accountToDelete.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onDeleteSuccess();
    } catch (err) {
      console.error("Lỗi khi xóa nguồn tiền:", err);
    } finally {
      setIsConfirmOpen(false);
      setAccountToDelete(null);
    }
  };

  if (isLoading) {
    return <div className={styles.loadingMessage}>Đang tải danh sách...</div>;
  }
  if (error && accounts.length === 0) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <>
      <div className={styles.accountListContainer}>
        {accounts.length === 0 && !isLoading && (
          <p className={styles.noItemsMessage}>Chưa có nguồn tiền nào.</p>
        )}
        <div className={styles.listItems}>
          {accounts.map((account) => (
            <AccountItem
              key={account.id}
              account={account}
              onEdit={onEditRequest}
              onDeleteRequest={requestDeleteAccount}
            />
          ))}
        </div>
      </div>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc muốn xóa nguồn tiền "${
          accountToDelete?.name || ""
        }" không?`}
      />
    </>
  );
};

export default AccountList;
