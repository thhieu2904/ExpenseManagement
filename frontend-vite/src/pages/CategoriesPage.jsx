// src/pages/CategoriesPage.jsx
import React, { useState, useCallback } from "react";
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import CategoryPageHeader, {
  CATEGORY_TYPE,
} from "../components/Categories/CategoryPageHeader";
import CategoryList from "../components/Categories/CategoryList";
import AddEditCategoryModal from "../components/Categories/AddEditCategoryModal"; // <-- IMPORT MODAL MỚI
import axios from "axios";

const CategoriesPage = () => {
  const [activeType, setActiveType] = useState(CATEGORY_TYPE.INCOME);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);

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
    setEditingCategory(null); // Reset khi đóng
  };

  const handleFormSubmit = async (formData) => {
    const token = localStorage.getItem("token");
    const apiUrl = editingCategory
      ? `http://localhost:5000/api/categories/${editingCategory.id}`
      : "http://localhost:5000/api/categories";
    const apiMethod = editingCategory ? "put" : "post";

    try {
      await axios[apiMethod](apiUrl, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      handleCloseModal();
      setListRefreshKey((prevKey) => prevKey + 1);
      // alert(editingCategory ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!'); // Có thể dùng toast
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

  return (
    <div>
      <Header />
      <Navbar />
      <main
        style={{
          padding: "20px",
          textAlign: "center",
        }}
      >
        <div style={{ padding: "20px" }}>
          <CategoryPageHeader
            activeCategoryType={activeType}
            onCategoryTypeChange={handleCategoryTypeChange}
            onAddCategoryClick={handleOpenAddModal}
          />
          <CategoryList
            key={listRefreshKey}
            categoryType={activeType}
            onEditCategory={handleOpenEditModal}
          />
        </div>
        <AddEditCategoryModal // <-- SỬ DỤNG MODAL MỚI
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
