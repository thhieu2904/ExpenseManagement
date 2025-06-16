// src/pages/CategoriesPage.jsx
import React, { useState, useCallback } from "react";
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import CategoryPageHeader, {
  CATEGORY_TYPE,
} from "../components/Categories/CategoryPageHeader";
import CategoryList from "../components/Categories/CategoryList";
import AddEditCategoryModal from "../components/Categories/AddEditCategoryModal";
import axios from "axios";

import CategoryAnalysisChart from "../components/Categories/CategoryAnalysisChart";
import styles from "../styles/CategoriesPage.module.css";

const CategoriesPage = () => {
  const [activeType, setActiveType] = useState(CATEGORY_TYPE.ALL);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // <-- Đổi tên để dùng chung

  const [period, setPeriod] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setCurrentDate(new Date());
  };

  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
  };

  const handleCategoryTypeChange = (newType) => {
    setActiveType(newType);
  };

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  // ✨ SỬA ĐỔI QUAN TRỌNG TẠI ĐÂY ✨
  const handleFormSubmit = async (formData) => {
    const token = localStorage.getItem("token");
    const isEditing = !!editingCategory;
    const categoryId = isEditing
      ? editingCategory._id || editingCategory.id
      : null;

    // Tự xây dựng payload để đảm bảo dữ liệu chính xác
    const payload = {
      name: formData.name,
      type: formData.type,
      icon: formData.icon,
    };

    const apiUrl = isEditing
      ? `http://localhost:5000/api/categories/${categoryId}`
      : "http://localhost:5000/api/categories";

    const apiMethod = isEditing ? "put" : "post";

    try {
      await axios[apiMethod](apiUrl, payload, {
        // Gửi payload đã được làm sạch
        headers: { Authorization: `Bearer ${token}` },
      });
      handleCloseModal();
      setRefreshKey((prevKey) => prevKey + 1); // Kích hoạt làm mới
    } catch (error) {
      console.error(
        "Lỗi khi lưu danh mục:",
        error.response?.data?.message || error.message
      );
      throw new Error(
        error.response?.data?.message || "Lỗi không xác định khi lưu."
      );
    }
  };

  // ✨ THÊM HÀM NÀY ĐỂ XỬ LÝ SAU KHI XÓA THÀNH CÔNG ✨
  const handleDeleteSuccess = () => {
    setRefreshKey((prevKey) => prevKey + 1); // Kích hoạt làm mới
  };

  return (
    <div>
      <Header />
      <Navbar />
      <main style={{ padding: "20px" }}>
        <CategoryPageHeader
          activeCategoryType={activeType}
          onCategoryTypeChange={handleCategoryTypeChange}
          onAddCategoryClick={handleOpenAddModal}
        />

        <div className={styles.mainContentRow}>
          <div className={styles.chartContainer}>
            {/* Thêm key để biểu đồ cũng được render lại */}
            <CategoryAnalysisChart
              key={`chart-${refreshKey}-${activeType}-${period}-${currentDate.toISOString()}`}
              categoryType={activeType}
              period={period}
              currentDate={currentDate}
              onPeriodChange={handlePeriodChange}
              onDateChange={handleDateChange}
            />
          </div>

          <div className={styles.listContainer}>
            {/* Sửa key và truyền prop mới */}
            <CategoryList
              key={`list-${refreshKey}-${activeType}-${period}-${currentDate.toISOString()}`}
              categoryType={activeType}
              onEditCategory={handleOpenEditModal}
              onDeleteSuccess={handleDeleteSuccess} // <-- TRUYỀN PROP MỚI
              period={period}
              currentDate={currentDate}
            />
          </div>
        </div>

        <AddEditCategoryModal
          isOpen={isModalOpen}
          mode={editingCategory ? "edit" : "add"}
          initialData={editingCategory}
          categoryType={activeType}
          onClose={handleCloseModal}
          onSubmit={handleFormSubmit}
        />
      </main>
      <Footer />
    </div>
  );
};

export default CategoriesPage;
