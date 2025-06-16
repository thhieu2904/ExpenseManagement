// src/components/Categories/CategoryList.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import styles from "./CategoryList.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { getIconObject } from "../../utils/iconMap";
import ConfirmDialog from "../Common/ConfirmDialog";

// Hàm định dạng tiền tệ
const formatCurrency = (amount) => {
  if (typeof amount !== "number") return "0 ₫";
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

// --- CategoryItem Component (Không thay đổi) ---
const CategoryItem = ({ category, onEdit, onDeleteRequest }) => {
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
          onClick={() =>
            onDeleteRequest(category._id || category.id, category.name)
          }
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
// 1. Nhận thêm period và currentDate từ props
const CategoryList = ({
  categoryType,
  onEditCategory,
  onCategoriesUpdate,
  onDeleteSuccess,
  period,
  currentDate,
}) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // 2. Thêm period và currentDate vào dependency array của useCallback
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

      // 3. Tạo đối tượng params và gửi nó trong yêu cầu axios
      const params = { period };
      if (period === "year") params.year = currentDate.getFullYear();
      if (period === "month") {
        params.year = currentDate.getFullYear();
        params.month = currentDate.getMonth() + 1;
      }
      if (period === "week")
        params.date = currentDate.toISOString().split("T")[0];

      const response = await axios.get("http://localhost:5000/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
        params: params, // Gửi các tham số thời gian này đi
      });

      if (response.data && Array.isArray(response.data)) {
        const filteredCategories =
          categoryType === "ALL"
            ? response.data
            : response.data.filter((cat) => cat.type === categoryType);
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
  }, [categoryType, period, currentDate]);

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

      // Gọi hàm callback để báo cho component cha biết việc xóa đã thành công
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }

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
                key={category._id || category.id}
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
