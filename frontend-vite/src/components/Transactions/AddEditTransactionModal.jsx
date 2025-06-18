import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./AddEditTransactionModal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// ✅ THAY ĐỔI 1: Import thêm icon cần thiết
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
  // ✅ THAY ĐỔI 1: State `amount` sẽ lưu giá trị số thuần (dưới dạng chuỗi), không có dấu chấm.
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

        if (mode === "edit" && initialData) {
          const initialType = initialData.type || "CHITIEU";
          setType(initialType);
          // ✅ THAY ĐỔI 2: Chuyển đổi amount từ số sang chuỗi khi ở chế độ sửa
          setAmount(String(initialData.amount || ""));
          setDescription(initialData.description || "");
          setDate(formatDateForInput(initialData.date));
          setAccountId(initialData.paymentMethod?._id || "");

          const catsForType = allCategories.filter(
            (c) => c.type === initialType
          );
          setFilteredCategories(catsForType);
          setCategoryId(initialData.category?._id || "");
        } else {
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

  useEffect(() => {
    if (categories.length > 0) {
      const filtered = categories.filter((cat) => cat.type === type);
      setFilteredCategories(filtered);
      if (mode === "add" || (mode === "edit" && type !== initialData?.type)) {
        setCategoryId(filtered[0]?._id || "");
      }
    }
  }, [type, categories, mode, initialData]);

  // ✅ THAY ĐỔI 3: Hàm xử lý riêng cho việc nhập số tiền
  const handleAmountChange = (e) => {
    const inputValue = e.target.value;
    // Chỉ giữ lại các ký tự số, loại bỏ dấu chấm và các ký tự khác
    const rawValue = inputValue.replace(/[^0-9]/g, "");
    setAmount(rawValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ✅ THAY ĐỔI 4: Bổ sung kiểm tra cho trường `description` và `amount`
    if (!amount || !categoryId || !accountId || !description.trim()) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    setIsLoading(true);
    setError("");

    const payload = {
      type,
      amount: parseFloat(amount), // Chuyển đổi chuỗi số thuần thành số thực
      name: description.trim(),
      note: description.trim(),
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

  // ✅ THAY ĐỔI 5: Tạo giá trị hiển thị đã được định dạng cho ô input
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
          {error && <p className={styles.errorMessage}>{error}</p>}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Loại giao dịch</label>
            <div className={styles.radioGroup}>
              {/* ✅ THAY ĐỔI 2: Thêm icon vào radio button Chi tiêu */}
              <label>
                <input
                  className={styles.radioInput}
                  type="radio"
                  value="CHITIEU"
                  checked={type === "CHITIEU"}
                  onChange={(e) => setType(e.target.value)}
                />
                <span className={`${styles.radioLabelText} ${styles.expense}`}>
                  <FontAwesomeIcon
                    icon={faArrowDown}
                    className={styles.radioIcon}
                  />
                  Chi tiêu
                </span>
              </label>
              {/* ✅ THAY ĐỔI 3: Thêm icon vào radio button Thu nhập */}
              <label>
                <input
                  className={styles.radioInput}
                  type="radio"
                  value="THUNHAP"
                  checked={type === "THUNHAP"}
                  onChange={(e) => setType(e.target.value)}
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
            <label htmlFor="amount" className={styles.formLabel}>
              Số tiền *
            </label>
            {/* ✅ THAY ĐỔI 4: Bọc input trong một div để thêm ký hiệu tiền tệ */}
            <div className={styles.amountInputWrapper}>
              <input
                id="amount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={displayAmount}
                onChange={handleAmountChange}
                className={styles.amountInput}
                placeholder="0"
                required
              />
              <span className={styles.currencySymbol}>₫</span>
            </div>
          </div>

          {/* ... các form group khác không thay đổi ... */}
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
              Tên/Mô tả giao dịch <span className={styles.requiredStar}>*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.formInput}
              placeholder="Ví dụ: Lương tháng 6, Ăn trưa với đối tác..."
              required
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
