// src/components/Accounts/AccountPageHeader.jsx
import React from "react";
import styles from "./AccountPageHeader.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faWallet } from "@fortawesome/free-solid-svg-icons";
import Button from "../Common/Button";

const AccountPageHeader = ({ onAddAccountClick }) => {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.titleSection}>
        <FontAwesomeIcon icon={faWallet} className={styles.titleIcon} />
        <h2 className={styles.title}>Quản Lý Nguồn Tiền</h2>
      </div>
      <Button
        onClick={onAddAccountClick}
        icon={<FontAwesomeIcon icon={faPlus} />}
        variant="secondary"
      >
        Thêm Nguồn Tiền
      </Button>
    </div>
  );
};

export default AccountPageHeader;
