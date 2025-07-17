import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import styles from "./AddEditTransactionModal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faArrowDown,
  faArrowUp,
  faExclamationTriangle,
  faCheckCircle,
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
  // Refs for focus management
  const firstInputRef = useRef(null);
  const amountInputRef = useRef(null);
  
  // State cho các trường trong form
  const [type, setType] = useState("CHITIEU");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(formatDateForInput(new Date()));
  const [note, setNote] = useState("");

  // State để lưu danh sách từ API
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);

  // State cho trạng thái modal
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Smart validation state
  const [touched, setTouched] = useState({});
  const [isValid, setIsValid] = useState(false);

  // Smart validation functions
  const validateField = useCallback((fieldName, value) => {
    switch (fieldName) {
      case 'amount':
        if (!value || value === '0') return 'Số tiền không được để trống';
        if (parseFloat(value) <= 0) return 'Số tiền phải lớn hơn 0';
        if (parseFloat(value) > 999999999) return 'Số tiền quá lớn';
        return null;
      case 'description':
        if (!value?.trim()) return 'Mô tả giao dịch không được để trống';
        if (value.trim().length < 3) return 'Mô tả phải có ít nhất 3 ký tự';
        if (value.trim().length > 100) return 'Mô tả không được quá 100 ký tự';
        return null;
      case 'categoryId':
        if (!value) return 'Vui lòng chọn danh mục';
        return null;
      case 'accountId':
        if (!value) return 'Vui lòng chọn tài khoản';
        return null;
      case 'date':
        if (!value) return 'Vui lòng chọn ngày';
        const selectedDate = new Date(value);
        const today = new Date();
        const futureLimit = new Date();
        futureLimit.setDate(today.getDate() + 30);
        if (selectedDate > futureLimit) return 'Ngày không được quá 30 ngày trong tương lai';
        return null;
      default:
        return null;
    }
  }, []);

  // Real-time validation
  const validateForm = useCallback(() => {
    const errors = {};
    errors.amount = validateField('amount', amount);
    errors.description = validateField('description', description);
    errors.categoryId = validateField('categoryId', categoryId);
    errors.accountId = validateField('accountId', accountId);
    errors.date = validateField('date', date);
    
    setFieldErrors(errors);
    const hasErrors = Object.values(errors).some(error => error !== null);
    setIsValid(!hasErrors);
    return !hasErrors;
  }, [amount, description, categoryId, accountId, date, validateField]);

  // Handle field blur for smart validation
  const handleFieldBlur = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  // Smart amount formatting
  const formatAmountDisplay = (value) => {
    if (!value) return '';
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue, 10).toLocaleString('vi-VN');
  };

  // Smart amount suggestions based on common values
  const getAmountSuggestions = () => {
    const commonAmounts = [
      10000, 20000, 50000, 100000, 200000, 500000, 1000000
    ];
    return commonAmounts;
  };

  // Auto-complete for description based on category
  const getDescriptionSuggestions = () => {
    const selectedCategory = filteredCategories.find(cat => cat._id === categoryId);
    if (!selectedCategory) return [];
    
    const suggestions = {
      'Ăn uống': ['Ăn sáng', 'Ăn trưa', 'Ăn tối', 'Cà phê', 'Trà sữa', 'Nhà hàng'],
      'Di chuyển': ['Xăng xe', 'Taxi', 'Grab', 'Xe bus', 'Vé tàu', 'Vé máy bay'],
      'Mua sắm': ['Quần áo', 'Giày dép', 'Mỹ phẩm', 'Siêu thị', 'Điện tử'],
      'Giải trí': ['Xem phim', 'Karaoke', 'Game', 'Sách', 'Du lịch'],
      'Lương': ['Lương tháng', 'Thưởng', 'Phụ cấp', 'Làm thêm'],
      'Đầu tư': ['Cổ phiếu', 'Tiết kiệm', 'Bảo hiểm', 'Vàng']
    };
    
    return suggestions[selectedCategory.name] || [];
  };

  // Enhanced amount change handler
  const handleAmountChange = (e) => {
    const inputValue = e.target.value;
    const rawValue = inputValue.replace(/[^0-9]/g, '');
    setAmount(rawValue);
    
    // Auto-move cursor to end
    setTimeout(() => {
      if (amountInputRef.current) {
        const length = formatAmountDisplay(rawValue).length;
        amountInputRef.current.setSelectionRange(length, length);
      }
    }, 0);
  };

  // Quick amount selection
  const handleAmountSuggestionClick = (suggestedAmount) => {
    setAmount(String(suggestedAmount));
    setTouched(prev => ({ ...prev, amount: true }));
  };

  // Smart description suggestions
  const handleDescriptionSuggestionClick = (suggestion) => {
    setDescription(suggestion);
    setTouched(prev => ({ ...prev, description: true }));
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (isValid && !isSubmitting) {
        handleSubmit(e);
      }
    }
  }, [onClose, isValid, isSubmitting]);

  // Focus management and keyboard listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Auto-focus first input after modal animation
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Validate form whenever relevant fields change
  useEffect(() => {
    validateForm();
  }, [validateForm]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Comprehensive validation before submit
    if (!validateForm()) {
      setError("Vui lòng kiểm tra lại các trường đã nhập.");
      // Mark all fields as touched to show validation errors
      setTouched({
        amount: true,
        description: true,
        categoryId: true,
        accountId: true,
        date: true
      });
      return;
    }

    setIsSubmitting(true);
    setError("");

    const payload = {
      type,
      amount: parseFloat(amount),
      name: description.trim(),
      note: note.trim(),
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
      
      // Success feedback
      setTimeout(() => {
        onSubmitSuccess();
      }, 300); // Small delay for better UX
      
    } catch (apiError) {
      setError(
        apiError.response?.data?.message ||
          `Lỗi khi ${isEditMode ? "sửa" : "thêm"} giao dịch.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modalTitle = mode === "add" ? "Thêm Giao Dịch" : "Sửa Giao Dịch";
  const submitButtonText = mode === "add" ? "Lưu Giao Dịch" : "Lưu Thay Đổi";

  const displayAmount = amount
    ? parseInt(amount, 10).toLocaleString("vi-VN")
    : "";

  // Helper function to get field error class
  const getFieldErrorClass = (fieldName) => {
    const hasError = touched[fieldName] && fieldErrors[fieldName];
    return hasError ? styles.fieldError : '';
  };

  // Helper function to show field error message
  const renderFieldError = (fieldName) => {
    const hasError = touched[fieldName] && fieldErrors[fieldName];
    return hasError ? (
      <span className={styles.errorText}>
        <FontAwesomeIcon icon={faExclamationTriangle} className={styles.errorIcon} />
        {fieldErrors[fieldName]}
      </span>
    ) : null;
  };

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
              <FontAwesomeIcon icon={faSpinner} spin /> Đang tải dữ liệu...
            </div>
          )}
          
          {error && (
            <div className={styles.errorMessage}>
              <FontAwesomeIcon icon={faExclamationTriangle} />
              {error}
            </div>
          )}

          {/* Smart form progress indicator */}
          {!isLoading && (
            <div className={styles.formProgress}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ 
                    width: `${Math.min(100, ((Object.keys(touched).length / 5) * 100))}%` 
                  }}
                />
              </div>
              <span className={styles.progressText}>
                {isValid ? (
                  <>
                    <FontAwesomeIcon icon={faCheckCircle} className={styles.successIcon} />
                    Sẵn sàng để lưu
                  </>
                ) : (
                  `Hoàn thành ${Object.keys(touched).length}/5 trường`
                )}
              </span>
            </div>
          )}

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
              ref={firstInputRef}
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleFieldBlur('description')}
              className={`${styles.formInput} ${getFieldErrorClass('description')}`}
              placeholder="Ví dụ: Lương tháng 6, Ăn trưa..."
              required
              disabled={isLoading}
              maxLength={100}
            />
            {renderFieldError('description')}
            
            {/* Smart suggestions for description */}
            {categoryId && getDescriptionSuggestions().length > 0 && (
              <div className={styles.amountSuggestions}>
                {getDescriptionSuggestions().slice(0, 4).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className={styles.amountSuggestion}
                    onClick={() => handleDescriptionSuggestionClick(suggestion)}
                    disabled={isLoading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="amount" className={styles.formLabel}>
              Số tiền <span className={styles.requiredStar}>*</span>
            </label>
            <div className={styles.amountInputWrapper}>
              <input
                ref={amountInputRef}
                id="amount"
                type="text"
                inputMode="numeric"
                value={displayAmount}
                onChange={handleAmountChange}
                onBlur={() => handleFieldBlur('amount')}
                className={`${styles.amountInput} ${getFieldErrorClass('amount')}`}
                placeholder="0"
                required
                disabled={isLoading}
              />
              <span className={styles.currencySymbol}>₫</span>
            </div>
            {renderFieldError('amount')}
            
            {/* Smart amount suggestions */}
            {!amount && (
              <div className={styles.amountSuggestions}>
                {getAmountSuggestions().map((suggestedAmount) => (
                  <button
                    key={suggestedAmount}
                    type="button"
                    className={styles.amountSuggestion}
                    onClick={() => handleAmountSuggestionClick(suggestedAmount)}
                    disabled={isLoading}
                  >
                    {suggestedAmount.toLocaleString('vi-VN')}₫
                  </button>
                ))}
              </div>
            )}
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
                onBlur={() => handleFieldBlur('categoryId')}
                className={`${styles.formInput} ${getFieldErrorClass('categoryId')}`}
                required
                disabled={isLoading || filteredCategories.length === 0}
              >
                <option value="">-- Chọn danh mục --</option>
                {filteredCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {renderFieldError('categoryId')}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="account" className={styles.formLabel}>
                Tài khoản <span className={styles.requiredStar}>*</span>
              </label>
              <select
                id="account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                onBlur={() => handleFieldBlur('accountId')}
                className={`${styles.formInput} ${getFieldErrorClass('accountId')}`}
                required
                disabled={isLoading || accounts.length === 0}
              >
                <option value="">-- Chọn tài khoản --</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
              {renderFieldError('accountId')}
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
                onBlur={() => handleFieldBlur('date')}
                className={`${styles.formInput} ${getFieldErrorClass('date')}`}
                required
                disabled={isLoading}
                max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              />
              {renderFieldError('date')}
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
              disabled={isLoading || isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`${styles.formButton} ${styles.submitButton} ${!isValid ? styles.disabledButton : ''}`}
              disabled={isLoading || isSubmitting || !isValid}
              title={!isValid ? 'Vui lòng kiểm tra lại các trường đã nhập' : 'Nhấn Ctrl+Enter để lưu nhanh'}
            >
              {isSubmitting ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span className={styles.buttonText}>Đang lưu...</span>
                </>
              ) : (
                <>
                  {isValid && <FontAwesomeIcon icon={faCheckCircle} className={styles.successIcon} />}
                  <span className={styles.buttonText}>{submitButtonText}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditTransactionModal;
