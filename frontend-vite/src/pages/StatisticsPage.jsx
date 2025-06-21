// THAY THẾ TOÀN BỘ FILE: frontend-vite/src/pages/StatisticsPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

import statisticsService from "../api/statisticsService";
import CategoryList from "../components/Categories/CategoryList";
// Components
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import DateRangeNavigator from "../components/Common/DateRangeNavigator";
import IncomeExpenseTrendChart from "../components/DetailedAnalyticsSection/IncomeExpenseTrendChart";
import CategoryExpenseChart from "../components/DetailedAnalyticsSection/CategoryExpenseChart"; // Đã được sửa
import TransactionList from "../components/Transactions/TransactionList";
import styles from "../styles/StatisticsPage.module.css";
import AddEditTransactionModal from "../components/Transactions/AddEditTransactionModal";
import ConfirmDialog from "../components/Common/ConfirmDialog";

const StatCard = ({ title, amount, type }) => (
  <div className={`${styles.statCard} ${styles[type]}`}>
    <div className={styles.cardTitle}>{title}</div>
    <div className={styles.cardAmount}>
      {(amount || 0).toLocaleString("vi-VN")} ₫
    </div>
  </div>
);
const StatisticsPage = () => {
  // State bộ lọc
  const [currentDate, setCurrentDate] = useState(new Date());
  const [period, setPeriod] = useState("month");
  const [activeTab, setActiveTab] = useState("trend");
  const [categoryType, setCategoryType] = useState("CHITIEU");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // State dữ liệu
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    cashFlow: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });
  const [categoryChartData, setCategoryChartData] = useState([]); // ✅ State mới cho biểu đồ tròn
  const [categoryChartTotal, setCategoryChartTotal] = useState(0); // ✅ State mới cho tổng biểu đồ tròn

  // State trạng thái
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(true); // ✅ State loading riêng cho biểu đồ

  // Lấy user data
  const [userData, setUserData] = useState(null);
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUserData(JSON.parse(storedUser));
  }, []);

  // ✅ Sửa lại để ánh xạ dữ liệu một cách chính xác
  const categoryListData = categoryChartData.map((chartItem) => ({
    _id: chartItem.id, // Dùng 'id' thật từ API cho '_id'
    id: chartItem.id, // Giữ lại 'id' nếu cần
    name: chartItem.name,
    icon: chartItem.icon,
    type: chartItem.type,
    totalAmount: chartItem.value, // Đổi tên 'value' thành 'totalAmount' để CategoryList dùng
    // Giữ lại 'value' gốc để CategoryExpenseChart dùng nếu cần
    value: chartItem.value,
  }));

  // ✅ Hàm gọi API tổng quan và danh sách giao dịch
  const fetchPageData = useCallback(
    async (page = 1, categoryId = null) => {
      setIsLoading(true);

      // THAY ĐỔI: Tính toán startDate, endDate từ period và currentDate
      let startDate, endDate;
      if (period === "week") {
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
        endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
      } else if (period === "month") {
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
      } else if (period === "year") {
        startDate = startOfYear(currentDate);
        endDate = endOfYear(currentDate);
      }

      const params = {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        page: page,
        limit: 10,
      };
      if (categoryId) params.categoryId = categoryId;
      try {
        const [summaryRes, transactionsRes] = await Promise.all([
          statisticsService.getSummaryStats(params),
          statisticsService.getTransactionsInPeriod(params),
        ]);
        setStats(summaryRes);
        setTransactions(transactionsRes.data);
        setPagination({
          currentPage: transactionsRes.currentPage,
          totalPages: transactionsRes.totalPages,
        });
      } catch (error) {
        console.error("Lỗi tải dữ liệu chính:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentDate, period] // THAY ĐỔI: Phụ thuộc vào state mới
  );

  // ✅ Hàm gọi API cho biểu đồ cơ cấu
  const fetchCategoryChartData = useCallback(async () => {
    setIsChartLoading(true);

    // THAY ĐỔI: Tính toán startDate, endDate từ period và currentDate
    let startDate, endDate;
    if (period === "week") {
      startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
      endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else if (period === "month") {
      startDate = startOfMonth(currentDate);
      endDate = endOfMonth(currentDate);
    } else if (period === "year") {
      startDate = startOfYear(currentDate);
      endDate = endOfYear(currentDate);
    }

    const params = {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      type: categoryType,
    };
    try {
      const res = await statisticsService.getCategoryData(params);
      setCategoryChartData(res);
      // Tính tổng giá trị của biểu đồ
      const total = res.reduce((sum, item) => sum + item.value, 0);
      setCategoryChartTotal(total);
    } catch (error) {
      console.error("Lỗi tải dữ liệu biểu đồ cơ cấu:", error);
    } finally {
      setIsChartLoading(false);
    }
  }, [currentDate, period, categoryType]); // THAY ĐỔI: Phụ thuộc vào state mới

  // useEffect gọi khi trang tải lần đầu hoặc đổi khoảng thời gian
  useEffect(() => {
    if (selectedCategory) {
      fetchPageData(1, selectedCategory.id);
    } else {
      fetchPageData(1);
    }
  }, [selectedCategory, fetchPageData]);

  // ✅ useEffect gọi khi người dùng chuyển tab hoặc đổi bộ lọc
  useEffect(() => {
    if (activeTab === "structure") {
      fetchCategoryChartData();
    }
    // Logic cho các tab khác nếu cần...
  }, [activeTab, fetchCategoryChartData]); // ✅ Phụ thuộc vào tab và hàm fetch

  const handlePageChange = (newPage) => {
    if (selectedCategory) {
      fetchPageData(newPage, selectedCategory.id);
    } else {
      fetchPageData(newPage);
    }
  };
  const handleChartSliceClick = (categoryData) => {
    // Nếu click vào danh mục đang được chọn, hãy bỏ chọn nó.
    if (selectedCategory && selectedCategory.name === categoryData.name) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryData);
    }
  };

  const handleListCategoryClick = (category) => {
    if (selectedCategory && selectedCategory.id === category.id) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleEditRequest = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };
  const handleDeleteRequest = (transactionId) => {
    setTransactionToDelete(transactionId);
    setIsConfirmOpen(true);
    setDeleteError(null);
  };
  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await statisticsService.deleteTransaction(transactionToDelete);
      setIsConfirmOpen(false);
      setTransactionToDelete(null);
      // Reload lại danh sách
      if (selectedCategory) {
        fetchPageData(pagination.currentPage, selectedCategory.id);
      } else {
        fetchPageData(pagination.currentPage);
      }
    } catch {
      setDeleteError("Xóa giao dịch thất bại!");
    } finally {
      setIsDeleting(false);
    }
  };
  const handleSubmitSuccess = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    // Reload lại danh sách
    if (selectedCategory) {
      fetchPageData(pagination.currentPage, selectedCategory.id);
    } else {
      fetchPageData(pagination.currentPage);
    }
  };

  // THAY ĐỔI: Thêm 2 handlers cho navigator
  const handleDateChange = (newDate) => setCurrentDate(newDate);
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setCurrentDate(new Date());
  };

  return (
    <div className={styles.pageContainer}>
      <Header userName={userData?.name} userAvatar={userData?.avatarUrl} />
      <Navbar />
      <main className={styles.pageWrapper}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Báo cáo & Phân tích</h1>
          <DateRangeNavigator
            period={period}
            currentDate={currentDate}
            onDateChange={handleDateChange}
            onPeriodChange={handlePeriodChange}
          />
        </div>

        <div className={styles.statsGrid}>
          <StatCard
            title="Tổng Thu Nhập"
            amount={stats.totalIncome}
            type="income"
          />
          <StatCard
            title="Tổng Chi Tiêu"
            amount={stats.totalExpense}
            type="expense"
          />
          <StatCard title="Dòng Tiền" amount={stats.cashFlow} type="cashFlow" />
        </div>

        <div className={styles.analysisSection}>
          <div className={styles.tabs}>
            <button
              onClick={() => setActiveTab("trend")}
              className={activeTab === "trend" ? styles.activeTab : ""}
            >
              Xu Hướng
            </button>
            <button
              onClick={() => setActiveTab("structure")}
              className={activeTab === "structure" ? styles.activeTab : ""}
            >
              Cơ Cấu
            </button>
          </div>
          <div className={styles.tabContent}>
            {activeTab === "trend" && (
              <IncomeExpenseTrendChart
                period={period}
                currentDate={currentDate}
              />
            )}
            {activeTab === "structure" && (
              <div className={styles.structureLayout}>
                {/* Cột 1: Biểu đồ */}
                <div className={styles.chartColumn}>
                  <div className={styles.subTabs}>
                    <button
                      onClick={() => setCategoryType("CHITIEU")}
                      className={
                        categoryType === "CHITIEU" ? styles.activeSubTab : ""
                      }
                    >
                      Chi Tiêu
                    </button>
                    <button
                      onClick={() => setCategoryType("THUNHAP")}
                      className={
                        categoryType === "THUNHAP" ? styles.activeSubTab : ""
                      }
                    >
                      Thu Nhập
                    </button>
                  </div>
                  <CategoryExpenseChart
                    data={categoryChartData}
                    total={categoryChartTotal}
                    loading={isChartLoading}
                    error={null}
                    onSliceClick={handleChartSliceClick} // Giữ lại tính năng tương tác
                  />
                </div>

                {/* Cột 2: Danh sách danh mục */}
                <div className={styles.listColumn}>
                  <CategoryList
                    categories={categoryListData}
                    isLoading={isChartLoading}
                    error={null}
                    selectedCategory={selectedCategory}
                    onEditCategory={() => {}}
                    onDeleteSuccess={() => {}}
                    onSelectCategory={handleListCategoryClick}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.listSection}>
          <div className={styles.listHeader}>
            <h2 className={styles.sectionTitle}>
              {selectedCategory
                ? `Giao dịch cho danh mục: "${selectedCategory.name}"`
                : "Giao dịch trong kỳ"}
            </h2>
            {/* ✅ BƯỚC 2.5: Hiển thị nút để xóa bộ lọc */}
            {selectedCategory && (
              <button
                className={styles.clearFilterButton}
                onClick={() => setSelectedCategory(null)}
              >
                Hiển thị tất cả
              </button>
            )}
          </div>
          <TransactionList
            transactions={transactions}
            pagination={pagination}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            onEditRequest={handleEditRequest}
            onDeleteRequest={handleDeleteRequest}
          />
        </div>
      </main>
      {isModalOpen && (
        <AddEditTransactionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmitSuccess={handleSubmitSuccess}
          mode={editingTransaction ? "edit" : "add"}
          initialData={editingTransaction}
        />
      )}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác."
        isProcessing={isDeleting}
        errorMessage={deleteError}
      />
      <Footer />
    </div>
  );
};

export default StatisticsPage;
