// src/components/Categories/AddEditCategoryModal.jsx
import React, { useState, useEffect } from "react";
import styles from "./AddEditCategoryModal.module.css"; // File CSS riêng
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { availableIconsForSelection, getIconObject } from "../../utils/iconMap"; // Đảm bảo đường dẫn đúng
import { CATEGORY_TYPE } from "./CategoryPageHeader";
const AddEditCategoryModal = ({
  isOpen,
  mode, // 'add' hoặc 'edit'
  categoryType: initialType,
  initialData,
  onClose,
  onSubmit, // Hàm này sẽ gọi API
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState(initialType || "expense");
  const [selectedIcon, setSelectedIcon] = useState(
    availableIconsForSelection[0]?.identifier || "default"
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setName(initialData.name || "");
        setType(initialData.type || CATEGORY_TYPE.EXPENSE);
        setSelectedIcon(
          initialData.icon ||
            availableIconsForSelection[0]?.identifier ||
            "default"
        );
        setError("");
      } else if (mode === "add") {
        setName("");
        setType(
          initialType === "ALL"
            ? CATEGORY_TYPE.EXPENSE
            : initialType || CATEGORY_TYPE.EXPENSE
        );
        setSelectedIcon(availableIconsForSelection[0]?.identifier || "default");
        setError("");
      }
    }
  }, [isOpen, mode, initialData, initialType]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Tên danh mục không được để trống.");
      return;
    }
    if (!selectedIcon) {
      setError("Vui lòng chọn một biểu tượng.");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      await onSubmit({
        // onSubmit được truyền từ CategoriesPage.jsx và sẽ gọi API
        name: name.trim(),
        type,
        icon: selectedIcon,
      });
      // Việc đóng modal và reset form nên được xử lý bởi component cha (CategoriesPage)
      // sau khi onSubmit thành công, thông qua việc gọi onClose và cập nhật state.
    } catch (apiError) {
      console.error("Lỗi khi submit form trong modal:", apiError);
      setError(apiError.message || "Có lỗi xảy ra khi lưu danh mục.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset lỗi khi đóng thủ công, nhưng không reset các trường input
    // vì người dùng có thể muốn giữ lại dữ liệu đã nhập nếu chỉ đóng tạm.
    // Việc reset form hoàn toàn sẽ do useEffect xử lý khi modal mở lại ở mode 'add'.
    setError("");
    onClose();
  };

  const modalTitle = mode === "add" ? "Thêm Danh Mục Mới" : "Sửa Danh Mục";
  const submitButtonText = mode === "add" ? "Thêm Danh Mục" : "Lưu Thay Đổi";

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{modalTitle}</h2>
          <button
            onClick={handleClose}
            className={styles.closeButton}
            aria-label="Đóng modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.categoryForm}>
          {error && <p className={styles.errorMessage}>{error}</p>}

          <div className={styles.formGroup}>
            <label htmlFor="categoryName" className={styles.formLabel}>
              Tên danh mục <span className={styles.requiredStar}>*</span>
            </label>
            <input
              type="text"
              id="categoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.formInput}
              placeholder="Ví dụ: Tiền ăn, Lương tháng..."
              required
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Loại danh mục <span className={styles.requiredStar}>*</span>
            </label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="categoryType"
                  value={CATEGORY_TYPE.EXPENSE} // <-- Sửa ở đây
                  checked={type === CATEGORY_TYPE.EXPENSE}
                  onChange={(e) => setType(e.target.value)}
                  disabled={isSubmitting}
                  className={styles.radioInput}
                />
                Chi tiêu
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="categoryType"
                  value={CATEGORY_TYPE.INCOME} // <-- Sửa ở đây
                  checked={type === CATEGORY_TYPE.INCOME}
                  onChange={(e) => setType(e.target.value)}
                  disabled={isSubmitting}
                  className={styles.radioInput}
                />
                Thu nhập
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Chọn biểu tượng <span className={styles.requiredStar}>*</span>
            </label>
            <div className={styles.iconSelectionGrid}>
              {availableIconsForSelection.map((iconInfo) => (
                <button
                  type="button"
                  key={iconInfo.identifier}
                  onClick={() => setSelectedIcon(iconInfo.identifier)}
                  className={`${styles.iconButton} ${
                    selectedIcon === iconInfo.identifier
                      ? styles.iconButtonSelected
                      : ""
                  }`}
                  title={iconInfo.name}
                  disabled={isSubmitting}
                >
                  <FontAwesomeIcon icon={getIconObject(iconInfo.identifier)} />
                </button>
              ))}
            </div>
          </div>

          <hr className={styles.formDivider} />

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className={`${styles.formButton} ${styles.cancelButton}`}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.formButton} ${styles.submitButton}`}
            >
              {isSubmitting && (
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  style={{ marginRight: "8px" }}
                />
              )}
              {submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditCategoryModal;
