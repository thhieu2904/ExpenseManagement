// frontend-vite/src/pages/CategoriesPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getCategories,
  addCategory,
  updateCategory,
} from "../api/categoriesService";

// Import components
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import CategoryPageHeader, { CATEGORY_TYPE } from "../components/Categories/CategoryPageHeader";
import CategoryList from "../components/Categories/CategoryList";
import AddEditCategoryModal from "../components/Categories/AddEditCategoryModal";
import CategoryAnalysisChart from "../components/Categories/CategoryAnalysisChart";
import styles from "../styles/CategoriesPage.module.css";

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
  "#AF19FF", "#FF4560", "#3366CC", "#DC3912"
];

const CategoriesPage = () => {
  const [searchParams] = useSearchParams();
  const highlightCategoryId = searchParams.get("highlight");
  
  // States
  const [activeType, setActiveType] = useState(CATEGORY_TYPE.ALL);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [period, setPeriod] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState(null);
  const [categoriesData, setCategoriesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
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
      console.error("Lỗi khi tải dữ liệu:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      setCategoriesData([]);
    } finally {
      setIsLoading(false);
    }
  }, [period, currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-highlight từ URL
  useEffect(() => {
    if (highlightCategoryId && categoriesData.length > 0) {
      const categoryToHighlight = categoriesData.find(
        (cat) => cat.id === highlightCategoryId || cat._id === highlightCategoryId
      );
      if (categoryToHighlight) {
        const categoryIndex = categoriesData.indexOf(categoryToHighlight);
        const color = COLORS[categoryIndex % COLORS.length];
        setActiveCategory({
          id: categoryToHighlight.id || categoryToHighlight._id,
          color: color,
          name: categoryToHighlight.name,
        });
      }
    }
  }, [highlightCategoryId, categoriesData]);

  // Handlers
  const handlePeriodChange = (newPeriod) => setPeriod(newPeriod);
  const handleDateChange = (newDate) => setCurrentDate(newDate);
  const handleCategoryTypeChange = (newType) => {
    setActiveType(newType);
    setActiveCategory(null);
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

  const handleSelectCategory = (categoryData) => {
    const currentActiveId = activeCategory ? activeCategory.id : null;
    if (categoryData && categoryData.id === currentActiveId) {
      setActiveCategory(null);
    } else {
      setActiveCategory(categoryData);
    }
  };

  const handleFormSubmit = async (formData) => {
    const isEditing = !!editingCategory;
    const categoryId = isEditing ? editingCategory._id || editingCategory.id : null;
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
      fetchData();
    } catch (error) {
      console.error("Lỗi khi lưu danh mục:", error);
      throw new Error(error.response?.data?.message || "Lỗi không xác định khi lưu.");
    }
  };

  // Data processing
  const { listData, chartData, chartTotal, categoryStats } = useMemo(() => {
    const filteredList = activeType === CATEGORY_TYPE.ALL
      ? categoriesData
      : categoriesData.filter((cat) => cat.type === activeType);

    // Tính toán stats cho widget
    const totalCategories = categoriesData.length;
    const incomeCategories = categoriesData.filter(cat => cat.type === "THUNHAP").length;
    const expenseCategories = categoriesData.filter(cat => cat.type === "CHITIEU").length;
    const usedCategories = categoriesData.filter(cat => cat.totalAmount > 0).length;
    
    // Tìm danh mục được sử dụng nhiều nhất theo loại filter hiện tại
    let mostUsedCategory = null;
    
    if (activeType === CATEGORY_TYPE.ALL) {
      // Hiển thị category có totalAmount cao nhất (cả thu nhập và chi tiêu)
      mostUsedCategory = categoriesData
        .filter(cat => cat.totalAmount > 0)
        .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))[0] || null;
    } else {
      // Hiển thị category có totalAmount cao nhất theo loại được filter
      mostUsedCategory = categoriesData
        .filter(cat => cat.type === activeType && cat.totalAmount > 0)
        .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))[0] || null;
    }

    const stats = {
      totalCategories,
      incomeCategories,
      expenseCategories,
      usedCategories,
      mostUsedCategory: mostUsedCategory ? {
        name: mostUsedCategory.name,
        icon: mostUsedCategory.icon,
        usageCount: mostUsedCategory.totalAmount || 0,
        type: mostUsedCategory.type // Thêm type để hiển thị thông tin đầy đủ hơn
      } : null
    };

    const finalChartData = filteredList
      .filter((cat) => cat.totalAmount > 0)
      .map((cat, index) => ({
        id: cat._id || cat.id,
        name: cat.name,
        value: cat.totalAmount,
        icon: cat.icon,
        color: COLORS[index % COLORS.length],
      }));

    const total = finalChartData.reduce((sum, item) => sum + item.value, 0);

    return {
      listData: filteredList,
      chartData: finalChartData,
      chartTotal: total,
      categoryStats: stats,
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
          categoryStats={categoryStats}
        />
        
        <div className={styles.analyticsSection}>
          <div>
            <h2 className="title-h2">📊 Phân tích danh mục</h2>
          </div>
          <div className={styles.contentRow}>
            <div className={styles.chartContainer}>
              <CategoryAnalysisChart
                data={chartData}
                total={chartTotal}
                loading={isLoading}
                error={error}
                categoryType={activeType}
                period={period}
                currentDate={currentDate}
                onPeriodChange={handlePeriodChange}
                onDateChange={handleDateChange}
                onActiveCategoryChange={handleSelectCategory}
              />
            </div>

            <div className={styles.listContainer}>
              <CategoryList
                onEditCategory={handleOpenEditModal}
                onDeleteSuccess={fetchData}
                categories={listData}
                isLoading={isLoading}
                error={error}
                activeCategory={activeCategory}
                onSelectCategory={handleSelectCategory}
                chartData={chartData}
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
