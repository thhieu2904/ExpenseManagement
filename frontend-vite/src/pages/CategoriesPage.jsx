// GHI ĐÈ VÀO FILE: frontend-vite/src/pages/CategoriesPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
// Bỏ axios
import {
  getCategories,
  addCategory,
  updateCategory,
} from "../api/categoriesService";

// Import các components
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import CategoryPageHeader, {
  CATEGORY_TYPE,
} from "../components/Categories/CategoryPageHeader";
import CategoryList from "../components/Categories/CategoryList";
import AddEditCategoryModal from "../components/Categories/AddEditCategoryModal";
// ✅ SỬA 1: DÙNG COMPONENT BIỂU ĐỒ ĐÃ ĐƯỢC HỢP NHẤT
import CategoryExpenseChart from "../components/DetailedAnalyticsSection/CategoryExpenseChart";
import styles from "../styles/CategoriesPage.module.css";

const CategoriesPage = () => {
  // State quản lý bộ lọc và modal
  const [activeType, setActiveType] = useState(CATEGORY_TYPE.ALL);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [period, setPeriod] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  // State quản lý dữ liệu
  const [categoriesData, setCategoriesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Logic fetch dữ liệu tập trung
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // const token = localStorage.getItem("token"); // Token đã được quản lý trong axiosConfig
      const params = { period };
      if (period === "year") params.year = currentDate.getFullYear();
      if (period === "month") {
        params.year = currentDate.getFullYear();
        params.month = currentDate.getMonth() + 1;
      }
      if (period === "week") {
        params.date = currentDate.toISOString().split("T")[0];
      }

      const data = await getCategories(params);
      setCategoriesData(data || []);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu trang danh mục:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      setCategoriesData([]);
    } finally {
      setIsLoading(false);
    }
  }, [period, currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Các hàm handler (không thay đổi nhiều)
  const handlePeriodChange = (newPeriod) => setPeriod(newPeriod);
  const handleDateChange = (newDate) => setCurrentDate(newDate);
  const handleCategoryTypeChange = (newType) => {
    setActiveType(newType);
    setActiveCategoryId(null); // Reset lựa chọn khi đổi tab
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

  // ✅ SỬA 2: Handler khi click vào slice biểu đồ HOẶC một item trong danh sách
  const handleSelectCategory = (categoryData) => {
    if (categoryData && categoryData.id === activeCategoryId) {
      setActiveCategoryId(null); // Bỏ chọn nếu click lại item đang được chọn
    } else {
      setActiveCategoryId(categoryData ? categoryData.id : null);
    }
  };

  // Logic form submit (không đổi)
  const handleFormSubmit = async (formData) => {
    const isEditing = !!editingCategory;
    const categoryId = isEditing
      ? editingCategory._id || editingCategory.id
      : null;
    const payload = {
      name: formData.name,
      type: formData.type,
      icon: formData.icon,
    };

    try {
      if (isEditing) {
        await updateCategory(categoryId, payload);
      } else {
        await addCategory(payload);
      }
      handleCloseModal();
      fetchData(); // Tải lại dữ liệu sau khi submit thành công
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

  // ✅ SỬA 3: Dùng `useMemo` để tối ưu việc lọc và tính toán dữ liệu
  const { listData, chartData, chartTotal } = useMemo(() => {
    const filteredList =
      activeType === CATEGORY_TYPE.ALL
        ? categoriesData
        : categoriesData.filter((cat) => cat.type === activeType);

    const filteredChartData = filteredList
      .filter((cat) => cat.totalAmount > 0)
      .map((cat) => ({
        id: cat._id || cat.id,
        name: cat.name,
        value: cat.totalAmount,
        icon: cat.icon,
      }));

    const total = filteredChartData.reduce((sum, item) => sum + item.value, 0);

    return {
      listData: filteredList,
      chartData: filteredChartData,
      chartTotal: total,
    };
  }, [activeType, categoriesData]);

  return (
    <div>
      <Header />
      <Navbar />
      <main className={styles.pageContainer}>
        <CategoryPageHeader
          activeCategoryType={activeType}
          onCategoryTypeChange={handleCategoryTypeChange}
          onAddCategoryClick={handleOpenAddModal}
          period={period}
          currentDate={currentDate}
          onPeriodChange={handlePeriodChange}
          onDateChange={handleDateChange}
        />
        <div className={styles.analyticsSection}>
          <div className={styles.contentRow}>
            {/* Cột 1: Biểu đồ */}
            <div className={styles.chartContainer}>
              {/* ✅ SỬA 4: Render component biểu đồ đã hợp nhất */}
              <CategoryExpenseChart
                data={chartData}
                total={chartTotal}
                loading={isLoading}
                error={error}
                onSliceClick={handleSelectCategory}
                activeCategoryId={activeCategoryId}
              />
            </div>

            {/* Cột 2: Danh sách */}
            <div className={styles.listContainer}>
              <CategoryList
                onEditCategory={handleOpenEditModal}
                onDeleteSuccess={fetchData}
                categories={listData}
                isLoading={isLoading}
                error={error}
                activeCategoryId={activeCategoryId}
                onSelectCategory={handleSelectCategory}
              />
            </div>
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
