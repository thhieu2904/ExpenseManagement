// Ghi vào file: frontend-vite/src/components/Transactions/TransactionFilterPanel.jsx

import React from "react";
import styles from "./TransactionFilterPanel.module.css";

const TransactionFilterPanel = ({
  filters,
  onFilterFieldChange,
  onApplyFilters,
  onResetFilters,
  categories = [],
  accounts = [],
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterFieldChange(name, value);
  };

  return (
    <div className={styles.filterPanel}>
      {/* Keyword Input */}
      <div className={`${styles.formGroup} ${styles.keyword}`}>
        <label htmlFor="keyword">Tên giao dịch</label>
        <input
          type="text"
          id="keyword"
          name="keyword"
          className={styles.formInput}
          placeholder="VD: Ăn trưa, Lương..."
          value={filters.keyword || ""}
          onChange={handleChange}
        />
      </div>

      {/* Type Select */}
      <div className={styles.formGroup}>
        <label htmlFor="type">Loại giao dịch</label>
        <select
          id="type"
          name="type"
          className={styles.formInput}
          value={filters.type || "ALL"}
          onChange={handleChange}
        >
          <option value="ALL">Tất cả</option>
          <option value="CHITIEU">Chi tiêu</option>
          <option value="THUNHAP">Thu nhập</option>
        </select>
      </div>

      {/* Category Select (giờ dùng prop `categories`) */}
      <div className={styles.formGroup}>
        <label htmlFor="category">Danh mục</label>
        <select
          id="category"
          name="categoryId"
          className={styles.formInput}
          value={filters.categoryId || "ALL"}
          onChange={handleChange}
        >
          <option value="ALL">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Account Select (giờ dùng prop `accounts`) */}
      <div className={styles.formGroup}>
        <label htmlFor="account">Tài khoản</label>
        <select
          id="account"
          name="accountId"
          className={styles.formInput}
          value={filters.accountId || "ALL"}
          onChange={handleChange}
        >
          <option value="ALL">Tất cả tài khoản</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Buttons */}
      <div className={styles.buttonGroup}>
        <button
          className={`${styles.button} ${styles.resetButton}`}
          onClick={onResetFilters}
        >
          Xóa lọc
        </button>
        <button
          className={`${styles.button} ${styles.applyButton}`}
          onClick={onApplyFilters}
        >
          Áp dụng
        </button>
      </div>
    </div>
  );
};

export default TransactionFilterPanel;
