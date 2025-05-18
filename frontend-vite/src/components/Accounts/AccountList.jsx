// src/components/Accounts/AccountList.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import styles from "./AccountList.module.css"; // File CSS riêng cho component này
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWallet,
  faCreditCard,
  faEdit,
  faTrashAlt,
  faUniversity,
  faMoneyBill,
} from "@fortawesome/free-solid-svg-icons";
import ConfirmDialog from "../Common/ConfirmDialog"; // Sử dụng lại ConfirmDialog
// AccountItem có thể được import nếu tách file, hoặc định nghĩa trực tiếp ở đây
// import AccountItem from './AccountItem';

// --- Hàm định dạng tiền tệ ---
const formatCurrency = (amount) => {
  if (typeof amount !== "number") return "0 ₫";
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

// --- AccountItem Component (định nghĩa trực tiếp hoặc import) ---
const AccountItem = ({ account, onEdit, onDeleteRequest }) => {
  const accountIcon = account.type === "cash" ? faMoneyBill : faUniversity; // Icon phù hợp hơn
  const accountTypeDisplay =
    account.type === "cash" ? "Tiền mặt" : "Ngân hàng/Thẻ";

  return (
    <div className={styles.accountItem}>
      <div className={styles.accountNameInfo}>
        <FontAwesomeIcon
          icon={accountIcon}
          className={styles.accountIconItem}
        />
        <div className={styles.accountTextDetails}>
          <span className={styles.accountName}>{account.name}</span>
          {account.type === "bank" &&
            (account.bankName || account.accountNumber) && (
              <span className={styles.accountSubDetail}>
                {account.bankName}
                {account.bankName && account.accountNumber ? " - " : ""}
                {account.accountNumber}
              </span>
            )}
        </div>
      </div>
      <div className={styles.accountTypeBadge}>
        <span
          className={`${styles.badge} ${
            account.type === "cash" ? styles.badgeCash : styles.badgeBank
          }`}
        >
          {accountTypeDisplay}
        </span>
      </div>
      <div className={styles.accountBalance}>
        {formatCurrency(account.balance)}
      </div>
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
  );
};

// --- AccountList Component ---
const AccountList = ({ onEditAccountRequest, listRefreshTrigger }) => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập.");
        setIsLoading(false);
        return;
      }
      const response = await axios.get("http://localhost:5000/api/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data && Array.isArray(response.data)) {
        setAccounts(response.data);
      } else {
        setAccounts([]);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách nguồn tiền:", err);
      setError("Không thể tải danh sách nguồn tiền.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts, listRefreshTrigger]); // Thêm listRefreshTrigger để fetch lại khi cần

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
      fetchAccounts(); // Tải lại danh sách
      // Không cần alert, có thể dùng toast notification ở component cha
      console.log(`Nguồn tiền "${accountToDelete.name}" đã được xóa.`);
    } catch (err) {
      console.error("Lỗi khi xóa nguồn tiền:", err);
      setError(`Lỗi khi xóa nguồn tiền "${accountToDelete.name}".`);
    } finally {
      setIsConfirmOpen(false);
      setAccountToDelete(null);
    }
  };

  if (isLoading) {
    return <div className={styles.loadingMessage}>Đang tải nguồn tiền...</div>;
  }
  if (error && accounts.length === 0) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <>
      <div className={styles.accountListContainer}>
        <div className={styles.listHeader}>
          <span className={styles.headerColumnName}>Nguồn tiền</span>
          <span className={styles.headerColumnType}>Loại</span>
          <span className={styles.headerColumnBalance}>Số dư</span>
          <span className={styles.headerColumnActions}>Hành động</span>
        </div>
        {error && accounts.length > 0 && (
          <p className={styles.inlineError}>{error}</p>
        )}
        {accounts.length === 0 && !isLoading && !error && (
          <p className={styles.noItemsMessage}>Chưa có nguồn tiền nào.</p>
        )}
        {accounts.length > 0 && (
          <div className={styles.listItems}>
            {accounts.map((account) => (
              <AccountItem
                key={account.id || account._id}
                account={account}
                onEdit={onEditAccountRequest} // Truyền prop từ cha
                onDeleteRequest={requestDeleteAccount}
              />
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa nguồn tiền"
        message={`Bạn có chắc chắn muốn xóa nguồn tiền "${
          accountToDelete?.name || ""
        }"? Tất cả giao dịch liên quan đến nguồn tiền này có thể bị ảnh hưởng hoặc xóa theo.`}
      />
    </>
  );
};

export default AccountList;
