// src/components/Accounts/AccountPageHeader.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faWallet } from "@fortawesome/free-solid-svg-icons";
import HeaderCard from "../Common/HeaderCard";
import PageTitle from "../Common/PageTitle";
import Button from "../Common/Button";
import styles from "./AccountPageHeader.module.css";

const AccountPageHeader = ({ 
  onAddAccountClick, 
  extra, 
  filter 
}) => {
  return (
    <HeaderCard
      title={
        <PageTitle 
          level="h1" 
          icon={faWallet}
          iconColor="#4f46e5"
        >
          Quản Lý Nguồn Tiền
        </PageTitle>
      }
      extra={extra}
      filter={filter}
      action={
        <Button
          onClick={onAddAccountClick}
          icon={<FontAwesomeIcon icon={faPlus} />}
          variant="secondary"
        >
          Thêm Nguồn Tiền
        </Button>
      }
    />
  );
};

export default AccountPageHeader;
