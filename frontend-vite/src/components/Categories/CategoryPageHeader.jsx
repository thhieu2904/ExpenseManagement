// src/components/Categories/CategoryPageHeader.jsx
import React from "react";
import styles from "./CategoryPageHeader.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTag } from "@fortawesome/free-solid-svg-icons";

// ✅ Import style của các nút điều khiển để dùng chung
import controlStyles from "../DetailedAnalyticsSection/IncomeExpenseTrendChart.module.css";
import { startOfWeek, endOfWeek } from "date-fns";

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
  // Các hàm hỗ trợ cho bộ lọc thời gian
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (period === "week") newDate.setDate(newDate.getDate() - 7);
    if (period === "month") newDate.setMonth(newDate.getMonth() - 1);
    if (period === "year") newDate.setFullYear(newDate.getFullYear() - 1);
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (period === "week") newDate.setDate(newDate.getDate() + 7);
    if (period === "month") newDate.setMonth(newDate.getMonth() + 1);
    if (period === "year") newDate.setFullYear(newDate.getFullYear() + 1);
    onDateChange(newDate);
  };

  const getDisplayBox = () => {
    // ✅ SỬA LẠI LOGIC HIỂN THỊ CHO TUẦN
    if (period === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${start.toLocaleDateString("vi-VN")} - ${end.toLocaleDateString(
        "vi-VN"
      )}`;
    }
    if (period === "month")
      return currentDate.toLocaleDateString("vi-VN", {
        month: "long",
        year: "numeric",
      });
    if (period === "year") return `Năm ${currentDate.getFullYear()}`;
    return "";
  };

  return (
    <div className={styles.categoryHeaderContainer}>
      {/* Phần bên trái chứa tiêu đề và các tab */}
      <div className={styles.leftSection}>
        <div className={styles.titleSection}>
          <FontAwesomeIcon icon={faTag} className={styles.titleIcon} />
          <h2 className={styles.title}>Quản lí danh mục</h2>
        </div>

        {/* ✅ ĐÃ THÊM LẠI PHẦN TAB BỊ THIẾU */}
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
      </div>

      {/* Phần bên phải chứa bộ lọc thời gian và nút "Thêm" */}
      <div className={styles.rightSection}>
        {/* Bộ lọc thời gian */}

        {/* Nút thêm */}
        <button
          onClick={onAddCategoryClick}
          className={styles.addCategoryButton}
        >
          <FontAwesomeIcon icon={faPlus} /> Thêm danh mục
        </button>
      </div>
      {/* Bộ lọc thời gian nằm dưới tiêu đề */}
      <div className={controlStyles.controlsGroup}>
        <div className={controlStyles.filterButtons}>
          <button
            onClick={() => onPeriodChange("week")}
            className={period === "week" ? controlStyles.active : ""}
          >
            Tuần
          </button>
          <button
            onClick={() => onPeriodChange("month")}
            className={period === "month" ? controlStyles.active : ""}
          >
            Tháng
          </button>
          <button
            onClick={() => onPeriodChange("year")}
            className={period === "year" ? controlStyles.active : ""}
          >
            Năm
          </button>
        </div>
        <div className={controlStyles.navButtonsBox}>
          <button onClick={handlePrev}>Trước</button>
          <div className={controlStyles.navDateBox}>{getDisplayBox()}</div>
          <button onClick={handleNext}>Sau</button>
        </div>
      </div>
    </div>
  );
};

export default CategoryPageHeader;
