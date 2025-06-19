// Ghi vào file: frontend-vite/src/components/Transactions/TransactionFilterPanel.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./TransactionFilterPanel.module.css"; // Sẽ tạo CSS ở bước sau

const TransactionFilterPanel = ({ onFilterChange }) => {
  // State nội bộ để quản lý giá trị của các input
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("ALL");
  const [categoryId, setCategoryId] = useState("ALL");
  const [accountId, setAccountId] = useState("ALL");

  // State để chứa danh sách categories và accounts từ API
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // Gọi API để lấy danh sách categories và accounts một lần khi component mount
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      try {
        const [catRes, accRes] = await Promise.all([
          axios.get("http://localhost:5000/api/categories", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/accounts", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setCategories(catRes.data || []);
        setAccounts(accRes.data || []);
      } catch (error) {
        console.error("Failed to fetch filter data", error);
      }
    };
    fetchData();
  }, []);

  // Hàm xử lý khi người dùng bấm nút "Áp dụng"
  const handleApplyFilters = () => {
    onFilterChange({
      keyword,
      type,
      categoryId,
      accountId,
    });
  };

  // Hàm xử lý khi reset bộ lọc
  const handleResetFilters = () => {
    setKeyword("");
    setType("ALL");
    setCategoryId("ALL");
    setAccountId("ALL");
    onFilterChange({}); // Gửi object rỗng để reset
  };

  return (
    // THÊM className cho div cha ở đây
    <div className={styles.filterPanel}>
      {/* THÊM className 'keyword' cho ô tìm kiếm */}
      <div className={`${styles.formGroup} ${styles.keyword}`}>
        <label htmlFor="keyword">Tên giao dịch</label>
        <input
          type="text"
          id="keyword"
          className={styles.formInput}
          placeholder="VD: Ăn trưa, Lương..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="type">Loại giao dịch</label>
        <select
          id="type"
          className={styles.formInput}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="ALL">Tất cả</option>
          <option value="CHITIEU">Chi tiêu</option>
          <option value="THUNHAP">Thu nhập</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="category">Danh mục</label>
        <select
          id="category"
          className={styles.formInput}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="ALL">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="account">Tài khoản</label>
        <select
          id="account"
          className={styles.formInput}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          <option value="ALL">Tất cả tài khoản</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.buttonGroup}>
        <button
          className={`${styles.button} ${styles.resetButton}`}
          onClick={handleResetFilters}
        >
          Xóa lọc
        </button>
        <button
          className={`${styles.button} ${styles.applyButton}`}
          onClick={handleApplyFilters}
        >
          Áp dụng
        </button>
      </div>
    </div>
  );
};

export default TransactionFilterPanel;
