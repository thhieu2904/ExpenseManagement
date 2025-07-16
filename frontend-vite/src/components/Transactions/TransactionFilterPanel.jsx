import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faEraser,
  faCheck,
  faWallet,
  faTag,
  faExchangeAlt,
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./TransactionFilterPanel.module.css";

const TransactionFilterPanel = ({
  filters,
  onFilterFieldChange,
  onApplyFilters,
  onResetFilters,
  categories = [],
  accounts = [],
  isLoading = false,
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterFieldChange(name, value);
  };

  return (
    <div className={styles.filterContainer}>
      {/* Filter Grid */}
      <div className={styles.filterGrid}>
        {/* Keyword Input - Full Width */}
        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label htmlFor="keyword" className={styles.formLabel}>
            <FontAwesomeIcon icon={faSearch} className={styles.labelIcon} />
            Tìm kiếm
          </label>
          <input
            type="text"
            id="keyword"
            name="keyword"
            className={styles.formInput}
            placeholder="Nhập mô tả, ghi chú hoặc từ khóa..."
            value={filters.keyword || ""}
            onChange={handleChange}
          />
        </div>

        {/* Type Select */}
        <div className={styles.formGroup}>
          <label htmlFor="type" className={styles.formLabel}>
            <FontAwesomeIcon
              icon={faExchangeAlt}
              className={styles.labelIcon}
            />
            Loại giao dịch
          </label>
          <select
            id="type"
            name="type"
            className={styles.formInput}
            value={filters.type || "ALL"}
            onChange={handleChange}
          >
            <option value="ALL">Tất cả loại</option>
            <option value="CHITIEU">💸 Chi tiêu</option>
            <option value="THUNHAP">💰 Thu nhập</option>
          </select>
        </div>

        {/* Category Select */}
        <div className={styles.formGroup}>
          <label htmlFor="category" className={styles.formLabel}>
            <FontAwesomeIcon icon={faTag} className={styles.labelIcon} />
            Danh mục
          </label>
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

        {/* Account Select */}
        <div className={styles.formGroup}>
          <label htmlFor="account" className={styles.formLabel}>
            <FontAwesomeIcon icon={faWallet} className={styles.labelIcon} />
            Tài khoản
          </label>
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

        {/* Date From */}
        <div className={styles.formGroup}>
          <label htmlFor="dateFrom" className={styles.formLabel}>
            <FontAwesomeIcon
              icon={faCalendarAlt}
              className={styles.labelIcon}
            />
            Từ ngày
          </label>
          <input
            type="date"
            id="dateFrom"
            name="dateFrom"
            className={styles.formInput}
            value={filters.dateFrom || ""}
            onChange={handleChange}
          />
        </div>

        {/* Date To */}
        <div className={styles.formGroup}>
          <label htmlFor="dateTo" className={styles.formLabel}>
            <FontAwesomeIcon
              icon={faCalendarAlt}
              className={styles.labelIcon}
            />
            Đến ngày
          </label>
          <input
            type="date"
            id="dateTo"
            name="dateTo"
            className={styles.formInput}
            value={filters.dateTo || ""}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.buttonGroup}>
        <button
          className={`${styles.button} ${styles.resetButton} ${isLoading ? styles.loading : ""}`}
          onClick={onResetFilters}
          type="button"
          disabled={isLoading}
        >
          <FontAwesomeIcon icon={faEraser} className={styles.buttonIcon} />
          Xóa bộ lọc
        </button>
        <button
          className={`${styles.button} ${styles.clearButton}`}
          onClick={() => onFilterFieldChange("keyword", "")}
          type="button"
          disabled={isLoading || !filters.keyword}
        >
          <FontAwesomeIcon icon={faEraser} className={styles.buttonIcon} />
          Xóa tìm kiếm
        </button>
        <button
          className={`${styles.button} ${styles.applyButton} ${isLoading ? styles.loading : ""}`}
          onClick={onApplyFilters}
          type="button"
          disabled={isLoading}
        >
          <FontAwesomeIcon icon={faCheck} className={styles.buttonIcon} />
          {isLoading ? "Đang lọc..." : "Áp dụng"}
        </button>
      </div>
    </div>
  );
};

export default TransactionFilterPanel;
