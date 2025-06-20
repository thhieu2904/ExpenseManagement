// src/pages/CategoriesPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// Import các components
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import CategoryPageHeader, {
  CATEGORY_TYPE,
} from "../components/Categories/CategoryPageHeader";
import CategoryList from "../components/Categories/CategoryList";
import AddEditCategoryModal from "../components/Categories/AddEditCategoryModal";
import CategoryAnalysisChart from "../components/Categories/CategoryAnalysisChart";
import styles from "../styles/CategoriesPage.module.css";

const CategoriesPage = () => {
  // --- STATE QUẢN LÝ BỘ LỌC VÀ MODAL ---
  const [activeType, setActiveType] = useState(CATEGORY_TYPE.ALL);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [period, setPeriod] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activePieIndex, setActivePieIndex] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  // --- STATE QUÄN LÝ DỮ LIỆU TẬP TRUNG ---
  const [categoriesData, setCategoriesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- LOGIC FETCH DỮ LIỆU TẬP TRUNG ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = { period };
      if (period === "year") params.year = currentDate.getFullYear();
      if (period === "month") {
        params.year = currentDate.getFullYear();
        params.month = currentDate.getMonth() + 1;
      }
      if (period === "week") {
        params.date = currentDate.toISOString().split("T")[0];
      }

      const response = await axios.get("http://localhost:5000/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
      });
      setCategoriesData(response.data || []);
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
  }, [fetchData, refreshTrigger]);

  // --- CÁC HÀM HANDLER ---
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

  const handleFormSubmit = async (formData) => {
    const token = localStorage.getItem("token");
    const isEditing = !!editingCategory;
    const categoryId = isEditing
      ? editingCategory._id || editingCategory.id
      : null;
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
        headers: { Authorization: `Bearer ${token}` },
      });
      handleCloseModal();
      setRefreshTrigger((prev) => prev + 1);
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
  const handleDeleteSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Handler khi chọn slice trên PieChart
  const handleActiveCategoryChange = (categoryId) => {
    setActiveCategoryId(categoryId);
    if (categoryId) {
      const idx = chartData.findIndex(
        (cat) => cat._id === categoryId || cat.id === categoryId
      );
      setActivePieIndex(idx);
    } else {
      setActivePieIndex(null);
    }
  };

  // --- ✅ THAY ĐỔI 1: XỬ LÝ VÀ CHUẨN BỊ DỮ LIỆU TRƯỚC KHI RENDER ---

  // Lọc dữ liệu cho CategoryList dựa trên tab đang active
  const listData =
    activeType === CATEGORY_TYPE.ALL
      ? categoriesData
      : categoriesData.filter((cat) => cat.type === activeType);

  // Chuẩn bị dữ liệu cho CategoryAnalysisChart từ listData
  const chartData = listData
    .filter((cat) => cat.totalAmount > 0) // Chỉ lấy các mục có giá trị để vẽ biểu đồ
    .map((cat) => ({
      name: cat.name,
      value: cat.totalAmount, // `recharts` PieChart dùng key là `value`
      icon: cat.icon,
    }));

  // Tính tổng cho con số ở giữa biểu đồ
  const chartTotal = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div>
      <Header />
      <Navbar />
      <main className={styles.pageContainer}>
        {" "}
        {/* Thêm class để dễ style tổng thể */}
        {/* ✅ SỬA 1: TRUYỀN TẤT CẢ PROPS CẦN THIẾT CHO HEADER */}
        <CategoryPageHeader
          activeCategoryType={activeType}
          onCategoryTypeChange={handleCategoryTypeChange}
          onAddCategoryClick={handleOpenAddModal}
          // Truyền state và handler của bộ lọc thời gian xuống đây
          period={period}
          currentDate={currentDate}
          onPeriodChange={handlePeriodChange}
          onDateChange={handleDateChange}
        />
        {/* ✅ SỬA 2: ĐƠN GIẢN HÓA BỐ CỤC, KHÔNG CÒN BỘ LỌC Ở ĐÂY */}
        <div className={styles.analyticsSection}>
          <div className={styles.contentRow}>
            {/* Cột 1: Biểu đồ */}
            <div className={styles.chartContainer}>
              <CategoryAnalysisChart
                categoryType={activeType}
                data={chartData}
                total={chartTotal}
                loading={isLoading}
                error={error}
                onActiveCategoryChange={handleActiveCategoryChange}
                activeIndex={activePieIndex}
              />
            </div>

            {/* Cột 2: Danh sách */}
            <div className={styles.listContainer}>
              <CategoryList
                onEditCategory={handleOpenEditModal}
                onDeleteSuccess={handleDeleteSuccess}
                categories={listData}
                isLoading={isLoading}
                error={error}
                activeCategoryId={activeCategoryId}
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
