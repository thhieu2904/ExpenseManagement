import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./AddEditTransactionModal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faArrowDown,
  faArrowUp,
} from "@fortawesome/free-solid-svg-icons";

// Hàm tiện ích để chuyển đổi Date object thành chuỗi 'YYYY-MM-DD'
const formatDateForInput = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
  const [note, setNote] = useState(""); // Thêm state cho Ghi chú

  // State để lưu danh sách từ API
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);

  // State cho trạng thái modal
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchDataAndPopulateForm = async () => {
      setIsLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      try {
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

        // --- BẮT ĐẦU PHẦN LOGIC SỬA LỖI ---
        if (mode === "edit" && initialData) {
          const initialType = initialData.type || "CHITIEU";
          setType(initialType);
          setAmount(String(initialData.amount || ""));
          setDescription(initialData.description || "");
          setNote(initialData.note || ""); // Cập nhật ghi chú
          setDate(formatDateForInput(initialData.date));

          // Gán accountId
          const accountIdToSet =
            initialData.paymentMethod?.id ||
            initialData.paymentMethod?._id ||
            "";
          setAccountId(accountIdToSet);

          // Lọc và gán categoryId
          const catsForType = allCategories.filter(
            (c) => c.type === initialType
          );
          setFilteredCategories(catsForType);
          const categoryIdToSet =
            initialData.category?.id || initialData.category?._id || "";
          setCategoryId(categoryIdToSet);
        } else {
          // Chế độ "add"
          // Mặc định là 'Chi tiêu'
          const initialType = "CHITIEU";
          setType(initialType);

          // Lọc danh mục theo loại mặc định
          const initialCats = allCategories.filter(
            (c) => c.type === initialType
          );
          setFilteredCategories(initialCats);

          // Reset các trường
          setAmount("");
          setDescription("");
          setNote("");
          setDate(formatDateForInput(new Date()));

          // ✅ THAY ĐỔI QUAN TRỌNG: Gán giá trị mặc định cho state
          // Sau khi có dữ liệu, lấy ID của mục đầu tiên và gán vào state
          if (initialCats.length > 0) {
            setCategoryId(initialCats[0]._id);
          } else {
            setCategoryId(""); // Nếu không có danh mục nào thì set rỗng
          }

          if (allAccounts.length > 0) {
            // Lưu ý: API accounts của bạn trả về `id` chứ không phải `_id`
            setAccountId(allAccounts[0].id);
          } else {
            setAccountId(""); // Nếu không có tài khoản nào thì set rỗng
          }
        }
        // --- KẾT THÚC PHẦN SỬA LỖI ---
      } catch (err) {
        setError("Không thể tải dữ liệu cho form.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataAndPopulateForm();
  }, [isOpen, mode, initialData]);

  // Cập nhật danh sách danh mục khi loại giao dịch thay đổi
  useEffect(() => {
    if (categories.length > 0) {
      const filtered = categories.filter((cat) => cat.type === type);
      setFilteredCategories(filtered);

      // Chỉ tự động chọn danh mục đầu tiên nếu không phải đang ở chế độ sửa
      // hoặc nếu người dùng đã chuyển loại (type) trong chế độ sửa
      if (mode === "add" || (mode === "edit" && type !== initialData?.type)) {
        setCategoryId(filtered[0]?._id || "");
      }
    }
  }, [type, categories, mode, initialData]);

  const handleAmountChange = (e) => {
    const inputValue = e.target.value;
    const rawValue = inputValue.replace(/[^0-9]/g, "");
    setAmount(rawValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !categoryId || !accountId || !description.trim()) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    setIsLoading(true);
    setError("");

    const payload = {
      type,
      amount: parseFloat(amount),
      name: description.trim(),
      note: note.trim(), // Thêm note vào payload
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
      onSubmitSuccess();
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

  const modalTitle = mode === "add" ? "Thêm Giao Dịch" : "Sửa Giao Dịch";
  const submitButtonText = mode === "add" ? "Lưu Giao Dịch" : "Lưu Thay Đổi";

  const displayAmount = amount
    ? parseInt(amount, 10).toLocaleString("vi-VN")
    : "";

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
          {isLoading && (
            <div className={styles.formLoading}>
              <FontAwesomeIcon icon={faSpinner} spin /> Đang tải...
            </div>
          )}
          {error && <p className={styles.errorMessage}>{error}</p>}

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
                  disabled={isLoading}
                />
                <span className={`${styles.radioLabelText} ${styles.expense}`}>
                  <FontAwesomeIcon
                    icon={faArrowDown}
                    className={styles.radioIcon}
                  />
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
                  disabled={isLoading}
                />
                <span className={`${styles.radioLabelText} ${styles.income}`}>
                  <FontAwesomeIcon
                    icon={faArrowUp}
                    className={styles.radioIcon}
                  />
                  Thu nhập
                </span>
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.formLabel}>
              Tên/Mô tả giao dịch <span className={styles.requiredStar}>*</span>
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.formInput}
              placeholder="Ví dụ: Lương tháng 6, Ăn trưa..."
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="amount" className={styles.formLabel}>
              Số tiền <span className={styles.requiredStar}>*</span>
            </label>
            <div className={styles.amountInputWrapper}>
              <input
                id="amount"
                type="text"
                inputMode="numeric"
                value={displayAmount}
                onChange={handleAmountChange}
                className={styles.amountInput}
                placeholder="0"
                required
                disabled={isLoading}
              />
              <span className={styles.currencySymbol}>₫</span>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="category" className={styles.formLabel}>
                Danh mục <span className={styles.requiredStar}>*</span>
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={styles.formInput}
                required
                disabled={isLoading || filteredCategories.length === 0}
              >
                {filteredCategories.length === 0 ? (
                  <option value="">Không có danh mục</option>
                ) : (
                  filteredCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="account" className={styles.formLabel}>
                Tài khoản <span className={styles.requiredStar}>*</span>
              </label>
              <select
                id="account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className={styles.formInput}
                required
                disabled={isLoading || accounts.length === 0}
              >
                {accounts.length === 0 ? (
                  <option value="">Không có tài khoản</option>
                ) : (
                  accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="date" className={styles.formLabel}>
                Ngày <span className={styles.requiredStar}>*</span>
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={styles.formInput}
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="note" className={styles.formLabel}>
                Ghi chú
              </label>
              <input
                id="note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={styles.formInput}
                placeholder="Thêm ghi chú nếu cần..."
                disabled={isLoading}
              />
            </div>
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
