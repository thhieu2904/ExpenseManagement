// src/components/Categories/CategoryList.jsx
import React, { useState } from "react"; // ✅ BỎ: useEffect, useCallback, axios
import styles from "./CategoryList.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { getIconObject } from "../../utils/iconMap";
import ConfirmDialog from "../Common/ConfirmDialog";
import axios from "axios"; // ✅ Vẫn cần axios cho việc xóa

// Hàm định dạng tiền tệ (Không đổi)
const formatCurrency = (amount) => {
  if (typeof amount !== "number") return "0 ₫";
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

// --- CategoryItem Component (Không thay đổi) ---
const CategoryItem = ({
  category,
  onEdit,
  onDeleteRequest,
  selected,
  onSelect,
}) => {
  const amountStyle =
    category.type === "THUNHAP" ? styles.incomeAmount : styles.expenseAmount;

  return (
    <div
      className={`${styles.categoryItem} ${selected ? styles.selected : ""}`}
      onClick={(e) => {
        // Nếu click vào nút edit/delete thì không gọi onSelect
        if (e.target.closest("button")) return;
        if (onSelect) onSelect(category);
      }}
      style={{ cursor: "pointer" }}
    >
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
          onClick={(e) => {
            e.stopPropagation();
            onEdit(category);
          }}
          className={`${styles.actionButton} ${styles.editButton}`}
          title="Sửa"
        >
          <FontAwesomeIcon icon={faEdit} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteRequest(category._id || category.id, category.name);
          }}
          className={`${styles.actionButton} ${styles.deleteButton}`}
          title="Xóa"
        >
          <FontAwesomeIcon icon={faTrashAlt} />
        </button>
      </div>
    </div>
  );
};

// --- ✅ THAY ĐỔI 1: CẬP NHẬT PROPS VÀ LOẠI BỎ LOGIC FETCH ---
const CategoryList = ({
  categories, // Nhận danh sách category đã được lọc
  isLoading, // Nhận trạng thái tải
  error, // Nhận thông báo lỗi
  onEditCategory,
  onDeleteSuccess,
  activeCategoryId,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  // State để quản lý lỗi xóa cục bộ
  const [deleteError, setDeleteError] = useState("");

  // Tìm category đang active trong list
  const activeCategory = activeCategoryId
    ? categories.find((cat) => (cat._id || cat.id) === activeCategoryId)
    : null;

  const requestDeleteCategory = (categoryId, categoryName) => {
    setDeleteError(""); // Reset lỗi xóa mỗi khi mở dialog
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

      // Gọi callback để báo cho component cha biết việc xóa thành công
      // Component cha sẽ kích hoạt việc fetch lại dữ liệu
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err) {
      console.error("Lỗi khi xóa danh mục:", err);
      const message =
        err.response?.data?.message ||
        `Lỗi khi xóa danh mục "${categoryToDelete.name}".`;
      setDeleteError(message);
    } finally {
      // Đóng dialog dù thành công hay thất bại
      setIsConfirmOpen(false);
      // Giữ lại categoryToDelete để hiển thị lỗi nếu có
    }
  };

  const handleEditCategory = (category) => {
    if (onEditCategory) {
      onEditCategory(category);
    }
  };

  // --- ✅ THAY ĐỔI 2: CẬP NHẬT LOGIC RENDER DỰA TRÊN PROPS ---
  if (isLoading) {
    return <div className={styles.loadingMessage}>Đang tải danh mục...</div>;
  }

  // Hiển thị lỗi fetch tổng quát nếu có và không có dữ liệu
  if (error && categories.length === 0) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <>
      <div className={styles.categoryListContainer}>
        <div></div>

        {/* Hiển thị lỗi fetch ngay cả khi có dữ liệu cũ */}
        {error && <p className={styles.inlineError}>{error}</p>}

        {/* Hiển thị tên category đang được chọn */}
        {activeCategory && (
          <div className={styles.activeCategoryNameDisplay}>
            Đang chọn: {activeCategory.name}
          </div>
        )}

        {categories.length === 0 && !isLoading && !error && (
          <p className={styles.noCategoriesMessage}>
            Không có danh mục nào để hiển thị.
          </p>
        )}
        {categories.length > 0 && (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mục</th>
                  <th>Tổng tiền</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, idx) => (
                  <tr
                    key={category._id || category.id || idx}
                    className={`${styles.row} ${
                      activeCategory &&
                      (category._id || category.id) === activeCategoryId
                        ? styles.highlight
                        : ""
                    }`}
                  >
                    <td>
                      <FontAwesomeIcon
                        icon={getIconObject(category.icon)}
                        className={styles.categoryIcon}
                      />
                      <span className={styles.categoryName}>
                        {category.name}
                      </span>
                    </td>
                    <td
                      className={
                        category.type === "THUNHAP"
                          ? styles.incomeAmount
                          : styles.expenseAmount
                      }
                    >
                      {formatCurrency(category.totalAmount)}
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategory(category);
                        }}
                        className={`${styles.actionButton} ${styles.editButton}`}
                        title="Sửa"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteCategory(
                            category._id || category.id,
                            category.name
                          );
                        }}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        title="Xóa"
                      >
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa danh mục"
        message={
          <>
            <p>
              Bạn có chắc chắn muốn xóa danh mục "
              <strong>{categoryToDelete?.name || ""}</strong>"?
            </p>
            <p className={styles.warningText}>
              Hành động này không thể hoàn tác và các giao dịch liên quan có thể
              bị ảnh hưởng.
            </p>
            {/* Hiển thị lỗi xóa ngay trong dialog */}
            {deleteError && (
              <p className={styles.dialogErrorText}>{deleteError}</p>
            )}
          </>
        }
      />
    </>
  );
};

export default CategoryList;
