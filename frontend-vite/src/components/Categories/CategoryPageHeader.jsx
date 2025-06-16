// src/components/Categories/CategoryPageHeader.jsx
import React from "react";
import styles from "./CategoryPageHeader.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTag } from "@fortawesome/free-solid-svg-icons";

export const CATEGORY_TYPE = {
  ALL: "ALL", // Thêm loại "Tất cả"
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
      <div className={styles.leftSection}>
        <div className={styles.titleSection}>
          <FontAwesomeIcon icon={faTag} className={styles.titleIcon} />
          <h2 className={styles.title}>Quản lí danh mục</h2>
        </div>
        <div className={styles.tabButtons}>
          {/* Nút Tất cả */}
          <button
            className={`${styles.tabButton} ${
              activeCategoryType === CATEGORY_TYPE.ALL ? styles.active : ""
            }`}
            onClick={() => onCategoryTypeChange(CATEGORY_TYPE.ALL)}
          >
            Tất cả
          </button>
          {/* Nút Thu nhập */}
          <button
            className={`${styles.tabButton} ${
              activeCategoryType === CATEGORY_TYPE.INCOME ? styles.active : ""
            }`}
            onClick={() => onCategoryTypeChange(CATEGORY_TYPE.INCOME)}
          >
            Danh mục thu nhập
          </button>
          {/* Nút Chi tiêu */}
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
      <div className={styles.addButtonContainer}>
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
