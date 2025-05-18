// Phần này có thể đặt trong AccountList.jsx hoặc tạo file AccountItem.jsx riêng
// Nếu đặt riêng, nhớ import styles từ './AccountList.module.css' hoặc tạo file CSS riêng cho AccountItem

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWallet,
  faCreditCard,
  faEdit,
  faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
// Import styles từ AccountList.module.css
// import styles from './AccountList.module.css'; (nếu tách file)

// Hàm định dạng tiền tệ (có thể đưa ra file utils chung)
const formatCurrency = (amount) => {
  if (typeof amount !== "number") return "0 ₫";
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

const AccountItem = ({ account, onEdit, onDeleteRequest, styles }) => {
  // Nhận styles từ cha
  const accountIcon = account.type === "cash" ? faWallet : faCreditCard;
  const accountTypeDisplay =
    account.type === "cash" ? "Tiền mặt" : "Thẻ/Ngân hàng";

  return (
    <div className={styles.accountItem}>
      <div className={styles.accountNameInfo}>
        <FontAwesomeIcon
          icon={accountIcon}
          className={styles.accountIconItem}
        />
        <div className={styles.accountText}>
          <span className={styles.accountName}>{account.name}</span>
          {account.type === "bank" &&
            (account.bankName || account.accountNumber) && (
              <span className={styles.accountDetail}>
                {account.bankName}
                {account.bankName && account.accountNumber ? " - " : ""}
                {account.accountNumber}
              </span>
            )}
        </div>
      </div>
      <div className={styles.accountTypeDisplay}>{accountTypeDisplay}</div>
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

// Để sử dụng AccountItem trong AccountList.jsx:
// <AccountItem account={account} onEdit={handleOpenEditModal} onDeleteRequest={requestDeleteAccount} styles={styles} />
