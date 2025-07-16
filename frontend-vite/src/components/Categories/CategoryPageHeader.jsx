// src/components/Categories/CategoryPageHeader.jsx
import React from "react";
import styles from "./CategoryPageHeader.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTag } from "@fortawesome/free-solid-svg-icons";
import HeaderCard from "../Common/HeaderCard";
import Button from "../Common/Button";
import CategoryStatsWidget from "./CategoryStatsWidget";

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

  // Props cho widget stats
  categoryStats = null,
}) => {
  return (
    <HeaderCard
      className={styles.categoryHeaderCard}
      title={
        <h1 className="title-h1">
          <FontAwesomeIcon icon={faTag} className={styles.titleIcon} />
          Quản lí danh mục
        </h1>
      }
      extra={
        categoryStats ? (
          <CategoryStatsWidget 
            categoryStats={categoryStats} 
            activeFilter={activeCategoryType}
            onFilterChange={onCategoryTypeChange}
          />
        ) : (
          <CategoryStatsWidget 
            categoryStats={{
              totalCategories: 0,
              incomeCategories: 0,
              expenseCategories: 0,
              usedCategories: 0,
              mostUsedCategory: null
            }}
            activeFilter={activeCategoryType}
            onFilterChange={onCategoryTypeChange}
          />
        )
      }
      filter={
        <div className={styles.filterGroup}>
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
                activeCategoryType === CATEGORY_TYPE.EXPENSE ? styles.active : ""
              }`}
              onClick={() => onCategoryTypeChange(CATEGORY_TYPE.EXPENSE)}
            >
              Chi tiêu
            </button>
          </div>
          <div className={styles.controlGroup}>
            <DateRangeNavigator
              period={period}
              currentDate={currentDate}
              onPeriodChange={onPeriodChange}
              onDateChange={onDateChange}
            />
          </div>
        </div>
      }
      action={
        <Button
          onClick={onAddCategoryClick}
          icon={<FontAwesomeIcon icon={faPlus} />}
          variant="primary"
        >
          Thêm danh mục
        </Button>
      }
    />
  );
};

export default CategoryPageHeader;
