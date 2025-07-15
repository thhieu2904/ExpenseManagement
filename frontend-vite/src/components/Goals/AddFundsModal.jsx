// src/components/Goals/AddFundsModal.jsx

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAccounts, addFundsToGoal } from "../../api/goalService";
import styles from "./AddFundsModal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import Select from "react-select";

// Component CustomOption không thay đổi
const CustomOption = (props) => {
  const { data, innerProps, innerRef, isFocused } = props;
  return (
    <div
      ref={innerRef}
      {...innerProps}
      className={styles.customOption}
      style={{ backgroundColor: isFocused ? "#f3f4f6" : "transparent" }}
    >
      <span className={styles.optionName}>{data.label}</span>
      <span className={styles.optionBalance}>
        {data.balance.toLocaleString("vi-VN")} ₫
      </span>
    </div>
  );
};

export default function AddFundsModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  goalData,
}) {
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(null);
  const [validationError, setValidationError] = useState("");

  const { data: accountsData = [], isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
    select: (res) => res.data,
    enabled: isOpen,
  });

  const addFundsMutation = useMutation({
    mutationFn: (variables) =>
      addFundsToGoal(variables.goalId, variables.payload),
    onSuccess: () => {
      onSubmitSuccess();
    },
  });

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setValidationError("");
      if (accountsData.length > 0 && !accountId) {
        setAccountId(accountsData[0].id);
      }
    } else {
      setAccountId(null);
    }
  }, [isOpen, accountsData]);

  useEffect(() => {
    const insufficientFundsError =
      "Số tiền nạp lớn hơn số dư hiện có trong tài khoản.";
    if (!amount || !accountId || !accountsData) {
      setValidationError("");
      return;
    }
    const selectedAccount = accountsData.find((acc) => acc.id === accountId);
    if (selectedAccount && parseFloat(amount) > selectedAccount.balance) {
      setValidationError(insufficientFundsError);
    } else {
      setValidationError("");
    }
  }, [amount, accountId, accountsData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validationError || addFundsMutation.isPending) return;

    if (!amount || parseFloat(amount) <= 0 || !accountId) {
      setValidationError("Vui lòng nhập số tiền và chọn tài khoản.");
      return;
    }

    const payload = {
      amount: parseFloat(amount),
      accountId: accountId,
      icon: "fa-piggy-bank",
    };
    addFundsMutation.mutate({ goalId: goalData._id, payload });
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setAmount(value);
  };

  if (!isOpen) return null;

  const displayAmount = amount
    ? parseInt(amount, 10).toLocaleString("vi-VN")
    : "";
  const accountOptions = accountsData.map((acc) => ({
    value: acc.id,
    label: acc.name,
    balance: acc.balance,
  }));

  const displayError =
    addFundsMutation.error?.response?.data?.message || validationError;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Nạp tiền cho mục tiêu</h2>
          <p className={styles.modalSubtitle}>"{goalData.name}"</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          {displayError && (
            <p className={styles.errorMessage}>{displayError}</p>
          )}
          <div className={styles.formGroup}>
            <label htmlFor="fund-amount" className={styles.formLabel}>
              Số tiền cần nạp <span className={styles.requiredStar}>*</span>
            </label>
            <div className={styles.amountInputWrapper}>
              <input
                id="fund-amount"
                type="text"
                inputMode="numeric"
                value={displayAmount}
                onChange={handleAmountChange}
                className={styles.amountInput}
                placeholder="0"
                required
                autoFocus
              />
              <span className={styles.currencySymbol}>₫</span>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="account-source" className={styles.formLabel}>
              Từ tài khoản <span className={styles.requiredStar}>*</span>
            </label>
            <Select
              id="account-source"
              options={accountOptions}
              value={accountOptions.find((opt) => opt.value === accountId)}
              onChange={(selectedOption) => setAccountId(selectedOption.value)}
              components={{ Option: CustomOption }}
              // ✅ BƯỚC SỬA LỖI: PHỤC HỒI LẠI ĐẦY ĐỦ NỘI DUNG CHO `styles`
              styles={{
                control: (base) => ({
                  ...base,
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  padding: "0.2rem",
                  boxShadow: "none",
                  "&:hover": { borderColor: "#a5b4fc" },
                }),
                singleValue: (base, state) => ({
                  ...base,
                  display: "flex",
                  alignItems: "center",
                }),
              }}
              // ✅ BƯỚC SỬA LỖI: PHỤC HỒI LẠI ĐẦY ĐỦ NỘI DUNG CHO `getOptionLabel`
              getOptionLabel={(option) => (
                <div className={styles.selectedOption}>
                  <span className={styles.optionName}>{option.label}</span>
                  <span className={styles.optionBalanceSmall}>
                    {option.balance.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              )}
              isLoading={isLoadingAccounts}
              isDisabled={addFundsMutation.isPending}
              placeholder={
                isLoadingAccounts
                  ? "Đang tải tài khoản..."
                  : "Chọn tài khoản..."
              }
              noOptionsMessage={() => "Không có tài khoản"}
            />
          </div>
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.formButton} ${styles.cancelButton}`}
              disabled={addFundsMutation.isPending}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`${styles.formButton} ${styles.submitButton}`}
              disabled={
                addFundsMutation.isPending ||
                !!validationError ||
                isLoadingAccounts
              }
            >
              {addFundsMutation.isPending ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                "Xác nhận"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
