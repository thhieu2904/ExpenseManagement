// src/components/Accounts/AccountPageHeader.jsx
import React from "react";
import styles from "./AccountPageHeader.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faWallet } from "@fortawesome/free-solid-svg-icons";

const AccountPageHeader = ({ onAddAccountClick }) => {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.titleSection}>
        <FontAwesomeIcon icon={faWallet} className={styles.titleIcon} />
        <h2 className={styles.title}>Quản Lý Nguồn Tiền</h2>
      </div>
      <button onClick={onAddAccountClick} className={`${styles.primaryButton}`}>
        <FontAwesomeIcon icon={faPlus} />
        <span>Thêm Nguồn Tiền</span>
      </button>
    </div>
  );
};

export default AccountPageHeader;
