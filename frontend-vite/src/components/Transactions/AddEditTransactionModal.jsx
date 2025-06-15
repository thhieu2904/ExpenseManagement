// src/components/Transactions/AddEditTransactionModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import styles from "./AddEditTransactionModal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

// ✅ Hàm tiện ích để chuyển đổi Date object thành chuỗi 'YYYY-MM-DD'
const formatDateForInput = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ✅ Component giờ đây nhận thêm `mode` và `initialData`
const AddEditTransactionModal = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  mode = "add",
  initialData = null,
}) => {
  // State cho các trường trong form
  const [type, setType] = useState("CHITIEU");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(formatDateForInput(new Date()));

  // State để lưu danh sách từ API
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);

  // State cho trạng thái modal
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ useEffect chính được viết lại để xử lý cả 2 mode
  useEffect(() => {
    if (!isOpen) return;

    const fetchDataAndPopulateForm = async () => {
      setIsLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      try {
        // Lấy dữ liệu cần thiết cho các dropdown
        const [categoriesRes, accountsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/categories", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/accounts", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const allCategories = categoriesRes.data;
        const allAccounts = accountsRes.data;
        setCategories(allCategories);
        setAccounts(allAccounts);

        // Kiểm tra mode để điền dữ liệu hoặc reset form
        if (mode === "edit" && initialData) {
          // Điền dữ liệu có sẵn vào form
          const initialType = initialData.type || "CHITIEU";
          setType(initialType);
          setAmount(initialData.amount || "");
          setDescription(initialData.description || "");
          setDate(formatDateForInput(initialData.date));
          setAccountId(initialData.paymentMethod?._id || "");

          // Lọc danh mục theo type của giao dịch đang sửa và set giá trị
          const catsForType = allCategories.filter(
            (c) => c.type === initialType
          );
          setFilteredCategories(catsForType);
          setCategoryId(initialData.category?._id || "");
        } else {
          // Đặt lại form cho chế độ "Thêm mới"
          const initialCats = allCategories.filter((c) => c.type === "CHITIEU");
          setFilteredCategories(initialCats);
          setType("CHITIEU");
          setAmount("");
          setDescription("");
          setDate(formatDateForInput(new Date()));
          setCategoryId(initialCats[0]?._id || "");
          setAccountId(allAccounts[0]?._id || "");
        }
      } catch (err) {
        setError("Không thể tải dữ liệu cho form.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataAndPopulateForm();
  }, [isOpen, mode, initialData]);

  // Lọc lại danh mục khi người dùng thay đổi loại Thu/Chi
  useEffect(() => {
    // Chỉ chạy khi categories đã được tải
    if (categories.length > 0) {
      const filtered = categories.filter((cat) => cat.type === type);
      setFilteredCategories(filtered);

      // Nếu không phải đang edit, hoặc đang edit nhưng đổi type, thì chọn mặc định item đầu tiên
      if (mode === "add" || (mode === "edit" && type !== initialData?.type)) {
        setCategoryId(filtered[0]?._id || "");
      }
    }
  }, [type, categories, mode, initialData]);

  // ✅ Hàm handleSubmit được nâng cấp để xử lý cả POST (thêm) và PUT (sửa)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !categoryId || !accountId) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    setIsLoading(true);
    setError("");

    const payload = {
      type,
      amount: parseFloat(amount),
      name: description,
      note: description,
      categoryId,
      accountId,
      date,
    };
    const token = localStorage.getItem("token");
    const isEditMode = mode === "edit";

    const url = isEditMode
      ? `http://localhost:5000/api/transactions/${initialData.id}`
      : "http://localhost:5000/api/transactions";
    const httpMethod = isEditMode ? "put" : "post";

    try {
      await axios[httpMethod](url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSubmitSuccess(); // Báo cho cha biết đã thành công
    } catch (apiError) {
      setError(
        apiError.response?.data?.message ||
          `Lỗi khi ${isEditMode ? "sửa" : "thêm"} giao dịch.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // ✅ Tiêu đề và nút bấm sẽ thay đổi tùy theo mode
  const modalTitle = mode === "add" ? "Thêm Giao Dịch" : "Sửa Giao Dịch";
  const submitButtonText = mode === "add" ? "Lưu Giao Dịch" : "Lưu Thay Đổi";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{modalTitle}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.transactionForm}>
          {/* Phần JSX của form không có nhiều thay đổi */}
          {/* ... Toàn bộ các thẻ input, select, textarea của bạn ... */}
          {error && <p className={styles.errorMessage}>{error}</p>}
          {/* ... */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Loại giao dịch</label>
            <div className={styles.radioGroup}>
              <label>
                <input
                  className={styles.radioInput}
                  type="radio"
                  value="CHITIEU"
                  checked={type === "CHITIEU"}
                  onChange={(e) => setType(e.target.value)}
                />
                <span
                  className={`${styles.radioLabel} ${styles.radioLabelText}`}
                >
                  Chi tiêu
                </span>
              </label>
              <label>
                <input
                  className={styles.radioInput}
                  type="radio"
                  value="THUNHAP"
                  checked={type === "THUNHAP"}
                  onChange={(e) => setType(e.target.value)}
                />
                <span
                  className={`${styles.radioLabel} ${styles.radioLabelText}`}
                >
                  Thu nhập
                </span>
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="amount" className={styles.formLabel}>
              Số tiền *
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={styles.formInput}
              placeholder="0"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category" className={styles.formLabel}>
              Danh mục *
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={styles.formInput}
              required
            >
              {filteredCategories.length === 0 && (
                <option disabled value="">
                  Không có danh mục
                </option>
              )}
              {filteredCategories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="account" className={styles.formLabel}>
              Tài khoản *
            </label>
            <select
              id="account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={styles.formInput}
              required
            >
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="date" className={styles.formLabel}>
              Ngày *
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={styles.formInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.formLabel}>
              Ghi chú
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.formInput}
              placeholder="Nhập mô tả cho giao dịch..."
            ></textarea>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.formButton} ${styles.cancelButton}`}
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`${styles.formButton} ${styles.submitButton}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                submitButtonText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditTransactionModal;
