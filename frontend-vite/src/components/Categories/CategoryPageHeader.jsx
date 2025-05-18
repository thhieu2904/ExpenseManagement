// src/components/Categories/CategoryPageHeader.jsx
import React from "react";
import styles from "./CategoryPageHeader.module.css"; // Sẽ sử dụng CSS được cập nhật
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTag } from "@fortawesome/free-solid-svg-icons";

export const CATEGORY_TYPE = {
  INCOME: "THUNHAP",
  EXPENSE: "CHITIEU",
};

const CategoryPageHeader = ({
  activeCategoryType,
  onCategoryTypeChange,
  onAddCategoryClick,
}) => {
  return (
    <div className={styles.categoryHeaderContainer}>
      {/* Phần bên trái: Tiêu đề và các nút tab */}
      <div className={styles.leftSection}>
        <div className={styles.titleSection}>
          <FontAwesomeIcon icon={faTag} className={styles.titleIcon} />
          <h2 className={styles.title}>Quản lí danh mục</h2>
        </div>
        <div className={styles.tabButtons}>
          <button
            className={`${styles.tabButton} ${
              activeCategoryType === CATEGORY_TYPE.INCOME ? styles.active : ""
            }`}
            onClick={() => onCategoryTypeChange(CATEGORY_TYPE.INCOME)}
          >
            Danh mục thu nhập
          </button>
          <button
            className={`${styles.tabButton} ${
              activeCategoryType === CATEGORY_TYPE.EXPENSE ? styles.active : ""
            }`}
            onClick={() => onCategoryTypeChange(CATEGORY_TYPE.EXPENSE)}
          >
            Danh mục chi tiêu
          </button>
        </div>
      </div>

      {/* Phần bên phải: Nút "Thêm danh mục" */}
      {/* Nút này sẽ được đẩy sang phải bằng justify-content: space-between của container cha */}
      <div className={styles.addButtonContainer}>
        {" "}
        {/* Optional container for better vertical alignment if needed */}
        <button
          onClick={onAddCategoryClick}
          className={styles.addCategoryButton}
        >
          <FontAwesomeIcon icon={faPlus} /> Thêm danh mục
        </button>
      </div>
    </div>
  );
};

export default CategoryPageHeader;
