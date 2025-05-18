// src/components/Categories/CategoryList.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import styles from "./CategoryList.module.css"; // Sử dụng CSS sẽ được cập nhật
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { getIconObject } from "../../utils/iconMap"; // Đảm bảo đường dẫn đúng
import ConfirmDialog from "../Common/ConfirmDialog";

// Hàm định dạng tiền tệ
const formatCurrency = (amount) => {
  if (typeof amount !== "number") return "0 ₫";
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

// --- CategoryItem Component ---
const CategoryItem = ({ category, onEdit, onDeleteRequest }) => {
  // Giả sử category object giờ có thêm trường totalAmount
  // và type ('income' hoặc 'expense') để xác định màu sắc
  const amountStyle =
    category.type === "THUNHAP" ? styles.incomeAmount : styles.expenseAmount;

  return (
    <div className={styles.categoryItem}>
      <div className={styles.categoryInfo}>
        <FontAwesomeIcon
          icon={getIconObject(category.icon)}
          className={styles.categoryIcon}
        />
        <span className={styles.categoryName}>{category.name}</span>
      </div>
      {/* Hiển thị tổng tiền thay cho cột biểu tượng cũ */}
      <div className={`${styles.categoryTotalAmount} ${amountStyle}`}>
        {category.totalAmount !== undefined
          ? formatCurrency(category.totalAmount)
          : "-"}
      </div>
      <div className={styles.categoryActions}>
        <button
          onClick={() => onEdit(category)}
          className={`${styles.actionButton} ${styles.editButton}`}
          title="Sửa"
        >
          <FontAwesomeIcon icon={faEdit} />
        </button>
        <button
          onClick={() => onDeleteRequest(category.id, category.name)}
          className={`${styles.actionButton} ${styles.deleteButton}`}
          title="Xóa"
        >
          <FontAwesomeIcon icon={faTrashAlt} />
        </button>
      </div>
    </div>
  );
};

// --- CategoryList Component ---
const CategoryList = ({ categoryType, onEditCategory, onCategoriesUpdate }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập.");
        setIsLoading(false);
        return;
      }
      // API GET /api/categories giờ đây cần trả về totalAmount cho mỗi danh mục
      // Hoặc bạn gọi một endpoint khác như /api/stats/categories-summary?type=income
      let apiUrl = `http://localhost:5000/api/categories`;
      // Nếu API của bạn hỗ trợ lọc theo type và trả về totalAmount:
      // apiUrl = `http://localhost:5000/api/categories?type=${categoryType}`;
      // Hoặc nếu là endpoint thống kê riêng:
      // apiUrl = `http://localhost:5000/api/stats/categories-summary?type=${categoryType}`;

      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && Array.isArray(response.data)) {
        // Lọc theo categoryType nếu API không tự lọc
        // Điều này phụ thuộc vào cách API của bạn được thiết kế
        const filteredCategories = response.data.filter(
          (cat) => cat.type === categoryType
        );
        // Sắp xếp theo totalAmount giảm dần (tùy chọn)
        // filteredCategories.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
        setCategories(filteredCategories);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error(`Lỗi khi tải danh mục ${categoryType}:`, err);
      setError(`Không thể tải danh mục ${categoryType}.`);
    } finally {
      setIsLoading(false);
    }
  }, [categoryType]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const requestDeleteCategory = (categoryId, categoryName) => {
    setCategoryToDelete({ id: categoryId, name: categoryName });
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/categories/${categoryToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCategories();
      if (onCategoriesUpdate) onCategoriesUpdate();
      console.log(`Danh mục "${categoryToDelete.name}" đã được xóa.`);
    } catch (err) {
      console.error("Lỗi khi xóa danh mục:", err);
      setError(`Lỗi khi xóa danh mục "${categoryToDelete.name}".`);
    } finally {
      setIsConfirmOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleEditCategory = (category) => {
    if (onEditCategory) {
      onEditCategory(category);
    }
  };

  if (isLoading) {
    return <div className={styles.loadingMessage}>Đang tải danh mục...</div>;
  }
  if (error && categories.length === 0) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <>
      <div className={styles.categoryListContainer}>
        <div className={styles.listHeader}>
          <span className={styles.headerColumnName}>
            Mục {categoryType === "income" ? "thu nhập" : "chi tiêu"}
          </span>
          {/* Thay đổi tên cột từ "Biểu tượng" thành "Tổng tiền" */}
          <span className={styles.headerColumnTotalAmount}>Tổng tiền</span>
          <span className={styles.headerColumnActions}>Hành động</span>
        </div>
        {error && categories.length > 0 && (
          <p className={styles.inlineError}>{error}</p>
        )}
        {categories.length === 0 && !isLoading && !error && (
          <p className={styles.noCategoriesMessage}>
            Không có danh mục nào để hiển thị.
          </p>
        )}
        {categories.length > 0 && (
          <div className={styles.listItems}>
            {categories.map((category) => (
              <CategoryItem
                key={category.id || category._id}
                category={category}
                onEdit={handleEditCategory}
                onDeleteRequest={requestDeleteCategory}
              />
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa danh mục"
        message={`Bạn có chắc chắn muốn xóa danh mục "${
          categoryToDelete?.name || ""
        }"? Các giao dịch liên quan có thể bị ảnh hưởng.`}
      />
    </>
  );
};

export default CategoryList;
