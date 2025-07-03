// src/components/Categories/CategoryList.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CategoryList.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { getIconObject } from "../../utils/iconMap";
import ConfirmDialog from "../Common/ConfirmDialog";
import { deleteCategory } from "../../api/categoriesService"; // ✅ THAY ĐỔI: Dùng service

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
  categories,
  isLoading,
  error,
  onEditCategory,
  onDeleteSuccess,
  activeCategory,
  onSelectCategory,
  chartData,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const activeItemRef = useRef(null); // Ref cho item đang active
  const navigate = useNavigate();

  // ✅ THÊM: State cho hộp thoại xác nhận mở danh sách giao dịch
  const [isNavigateConfirmOpen, setIsNavigateConfirmOpen] = useState(false);
  const [categoryToNavigate, setCategoryToNavigate] = useState(null);

  const activeCategoryId = activeCategory ? activeCategory.id : null;

  // ✅ THAY ĐỔI: useEffect để cuộn tới item được chọn
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  }, [activeCategoryId]);

  const requestDeleteCategory = (categoryId, categoryName) => {
    setDeleteError(""); // Reset lỗi xóa mỗi khi mở dialog
    setCategoryToDelete({ id: categoryId, name: categoryName });
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      // ✅ THAY ĐỔI: Gọi hàm xóa từ service
      await deleteCategory(categoryToDelete.id);

      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
      // Đóng dialog sau khi thành công
      setIsConfirmOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error("Lỗi khi xóa danh mục:", err);
      const message =
        err.response?.data?.message ||
        `Lỗi khi xóa danh mục "${categoryToDelete.name}".`;
      setDeleteError(message);
      // Giữ dialog mở để người dùng thấy lỗi
    }
  };

  const handleEditCategory = (category) => {
    if (onEditCategory) {
      onEditCategory(category);
    }
  };

  // ✅ THÊM: Hàm xử lý click vào category để mở hộp thoại xác nhận
  const handleCategoryClick = (category) => {
    // Luôn highlight trước khi hỏi
    const chartEquivalent = chartData.find(
      (c) => c.id === (category._id || category.id)
    );
    // Nếu không có trong chart (giá trị = 0), không cần màu, chỉ cần ID
    const payload = chartEquivalent
      ? chartEquivalent
      : { id: category._id || category.id };
    onSelectCategory(payload);

    // Sau đó mở dialog
    setCategoryToNavigate(category);
    setIsNavigateConfirmOpen(true);
  };

  // ✅ THÊM: Hàm xử lý xác nhận mở danh sách giao dịch
  const handleConfirmNavigate = () => {
    if (categoryToNavigate) {
      navigate(
        `/transactions?categoryId=${categoryToNavigate._id || categoryToNavigate.id}`
      );
    }
    setIsNavigateConfirmOpen(false);
    setCategoryToNavigate(null);
  };

  // ✅ THÊM: Hàm đóng hộp thoại xác nhận
  const handleCloseNavigateConfirm = () => {
    setIsNavigateConfirmOpen(false);
    setCategoryToNavigate(null);
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
                  <th scope="col">Mục</th>
                  <th scope="col">Tổng tiền</th>
                  <th scope="col">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const isSelected =
                    activeCategoryId &&
                    (category._id || category.id) === activeCategoryId;

                  return (
                    <tr
                      key={category._id || category.id}
                      ref={isSelected ? activeItemRef : null} // Gán ref nếu item được chọn
                      className={`${styles.row} ${
                        isSelected ? styles.highlight : ""
                      }`}
                      style={
                        isSelected && activeCategory.color
                          ? {
                              backgroundColor: `${activeCategory.color}20`,
                              borderLeft: `4px solid ${activeCategory.color}`,
                            }
                          : {}
                      }
                      onClick={() => handleCategoryClick(category)}
                      role="button"
                      aria-selected={isSelected}
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
                            e.stopPropagation(); // Ngăn event click của tr
                            handleEditCategory(category);
                          }}
                          className={`${styles.actionButton} ${styles.editButton}`}
                          title="Sửa"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Ngăn event click của tr
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
                  );
                })}
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
            {deleteError && (
              <p className={styles.errorMessageDialog}>{deleteError}</p>
            )}
          </>
        }
      />
      {/* ✅ THÊM: Hộp thoại xác nhận mở danh sách giao dịch */}
      <ConfirmDialog
        isOpen={isNavigateConfirmOpen}
        onClose={handleCloseNavigateConfirm}
        onConfirm={handleConfirmNavigate}
        title="Mở danh sách giao dịch"
        message={
          <>
            <p>
              Bạn có muốn mở danh sách giao dịch của danh mục "
              <strong>{categoryToNavigate?.name || ""}</strong>" không?
            </p>
            <p>
              Hệ thống sẽ chuyển đến trang Giao dịch và lọc theo danh mục này.
            </p>
          </>
        }
      />
    </>
  );
};

export default CategoryList;
