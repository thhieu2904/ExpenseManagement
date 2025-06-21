// src/components/Categories/CategoryPageHeader.jsx
import React from "react";
import styles from "./CategoryPageHeader.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTag } from "@fortawesome/free-solid-svg-icons";

// Import component điều hướng riêng
import DateRangeNavigator from "../Common/DateRangeNavigator";

export const CATEGORY_TYPE = {
  ALL: "ALL",
  INCOME: "THUNHAP",
  EXPENSE: "CHITIEU",
};

const CategoryPageHeader = ({
  // Props cho các tab
  activeCategoryType,
  onCategoryTypeChange,

  // Props cho nút "Thêm"
  onAddCategoryClick,

  // Props cho bộ lọc thời gian
  period,
  currentDate,
  onPeriodChange,
  onDateChange,
}) => {
  return (
    <div className={styles.categoryHeaderContainer}>
      {/* Tầng 1: Tiêu đề */}
      <div className={styles.titleSection}>
        <FontAwesomeIcon icon={faTag} className={styles.titleIcon} />
        <h2 className={styles.title}>Quản lí danh mục</h2>
      </div>

      {/* Tầng 2: Các nút điều khiển */}
      <div className={styles.controlsContainer}>
        {/* Nhóm điều khiển bên trái */}
        <div className={styles.leftControls}>
          {/* Các tab lọc loại danh mục */}
          <div className={styles.tabButtons}>
            <button
              className={`${styles.tabButton} ${
                activeCategoryType === CATEGORY_TYPE.ALL ? styles.active : ""
              }`}
              onClick={() => onCategoryTypeChange(CATEGORY_TYPE.ALL)}
            >
              Tất cả
            </button>
            <button
              className={`${styles.tabButton} ${
                activeCategoryType === CATEGORY_TYPE.INCOME ? styles.active : ""
              }`}
              onClick={() => onCategoryTypeChange(CATEGORY_TYPE.INCOME)}
            >
              Thu nhập
            </button>
            <button
              className={`${styles.tabButton} ${
                activeCategoryType === CATEGORY_TYPE.EXPENSE
                  ? styles.active
                  : ""
              }`}
              onClick={() => onCategoryTypeChange(CATEGORY_TYPE.EXPENSE)}
            >
              Chi tiêu
            </button>
          </div>

          {/* Bộ lọc và điều hướng thời gian */}
          <DateRangeNavigator
            period={period}
            currentDate={currentDate}
            onPeriodChange={onPeriodChange}
            onDateChange={onDateChange}
          />
        </div>

        {/* Nút thêm danh mục (bên phải) */}
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
