// Mở và THAY THẾ TOÀN BỘ file: frontend-vite/src/pages/TransactionsPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { startOfWeek, endOfWeek } from "date-fns";
import styles from "../styles/TransactionsPage.module.css";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Services
import axiosInstance from "../api/axiosConfig";
import { deleteTransaction } from "../api/transactionsService";
import { getCategories } from "../api/categoriesService";
import { getAccounts } from "../api/accountsService";

// Components
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import StatsOverview from "../components/StatsOverview/StatsOverview";
import DateRangeNavigator from "../components/Common/DateRangeNavigator";
import TransactionCalendar from "../components/Transactions/TransactionCalendar";
import TransactionFilterPanel from "../components/Transactions/TransactionFilterPanel";
import TransactionList from "../components/Transactions/TransactionList";
import AddEditTransactionModal from "../components/Transactions/AddEditTransactionModal";
import ConfirmDialog from "../components/Common/ConfirmDialog";

const TransactionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFiltersFromUrl = useMemo(() => {
    const filters = {};
    const categoryId = searchParams.get("categoryId");
    const accountId = searchParams.get("accountId");
    if (categoryId) filters.categoryId = categoryId;
    if (accountId) filters.accountId = accountId;
    return filters;
  }, [searchParams]);

  // State dữ liệu
  const [statsData, setStatsData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });
  const [calendarData, setCalendarData] = useState({});
  const [categoryList, setCategoryList] = useState([]);
  const [accountList, setAccountList] = useState([]);

  // State quản lý
  const [currentDate, setCurrentDate] = useState(new Date());
  const [period, setPeriod] = useState("month");
  const [activeFilters, setActiveFilters] = useState(initialFiltersFromUrl);
  const [tempFilters, setTempFilters] = useState(initialFiltersFromUrl);
  const [isLoading, setIsLoading] = useState({ page: true, filters: true });
  const [error, setError] = useState("");
  const [initialDataLoaded, setInitialDataLoaded] = useState(false); // ✅ Cờ để điều phối

  // State modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // ✅ Step 1: Tải dữ liệu cho bộ lọc
  useEffect(() => {
    const fetchFilterData = async () => {
      setIsLoading((prev) => ({ ...prev, filters: true }));
      try {
        const [catRes, accRes] = await Promise.all([
          getCategories(),
          getAccounts({}),
        ]);
        setCategoryList(catRes || []);
        setAccountList(accRes || []);
        setInitialDataLoaded(true);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu cho bộ lọc:", error);
        setError("Không thể tải được các tùy chọn trong bộ lọc.");
      } finally {
        setIsLoading((prev) => ({ ...prev, filters: false }));
      }
    };
    fetchFilterData();
  }, []);

  // ✅ Step 2: Tải dữ liệu trang chính (chỉ chạy sau khi Step 1 hoàn tất)
  const fetchPageData = useCallback(
    async (page = 1) => {
      if (!initialDataLoaded) return; // Chờ cho đến khi dữ liệu filter được tải xong

      setIsLoading((prev) => ({ ...prev, page: true }));
      setError("");

      const getRequestParams = (currentFilters) => {
        let params = { page, limit: 10, ...currentFilters };
        if (period === "week") {
          params.startDate = startOfWeek(currentDate, {
            weekStartsOn: 1,
          }).toISOString();
          params.endDate = endOfWeek(currentDate, {
            weekStartsOn: 1,
          }).toISOString();
        } else if (period === "year") {
          params.year = currentDate.getFullYear();
        } else {
          // month
          params.year = currentDate.getFullYear();
          params.month = currentDate.getMonth() + 1;
        }
        return params;
      };

      try {
        const overviewParams = {
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1,
        };
        const [statsRes, calendarRes, transactionsRes] = await Promise.all([
          axiosInstance.get("/statistics/overview", { params: overviewParams }),
          axiosInstance.get("/statistics/calendar", { params: overviewParams }),
          axiosInstance.get("/transactions", {
            params: getRequestParams(activeFilters),
          }),
        ]);
        setStatsData(statsRes.data);
        setCalendarData(calendarRes.data);
        setTransactions(transactionsRes.data.data);
        setPagination({
          currentPage: transactionsRes.data.currentPage,
          totalPages: transactionsRes.data.totalPages,
        });
      } catch (err) {
        setError("Không thể tải danh sách giao dịch.");
        console.error("Fetch page data error:", err);
      } finally {
        setIsLoading((prev) => ({ ...prev, page: false }));
      }
    },
    [initialDataLoaded, currentDate, period, activeFilters]
  ); // Chỉ phụ thuộc vào activeFilters

  useEffect(() => {
    if (initialDataLoaded) {
      fetchPageData(pagination.currentPage);
    }
  }, [initialDataLoaded, activeFilters, pagination.currentPage, fetchPageData]);

  // Effect để xóa URL params (giữ nguyên)
  useEffect(() => {
    if (searchParams.get("categoryId") || searchParams.get("accountId")) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Handlers
  const handlePageChange = (newPage) =>
    setPagination((p) => ({ ...p, currentPage: newPage }));
  const handleFilterFieldChange = (fieldName, value) =>
    setTempFilters((prev) => ({ ...prev, [fieldName]: value }));
  const handleApplyFilters = () => {
    setActiveFilters(tempFilters);
    handlePageChange(1);
  };
  const handleResetFilters = () => {
    const emptyFilters = {};
    setActiveFilters(emptyFilters);
    setTempFilters(emptyFilters);
    handlePageChange(1);
  };
  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
    handlePageChange(1);
  };
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    handleDateChange(new Date());
  };
  const handleEditRequest = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };
  const handleDeleteRequest = (transactionId) => {
    setTransactionToDelete(transactionId);
    setIsConfirmOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await deleteTransaction(transactionToDelete);
      fetchPageData(pagination.currentPage);
    } catch (err) {
      alert("Xóa giao dịch thất bại!");
      console.error("Lỗi khi xóa giao dịch:", err);
    } finally {
      setIsConfirmOpen(false);
      setTransactionToDelete(null);
    }
  };
  const handleSubmitSuccess = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    fetchPageData(pagination.currentPage);
  };

  return (
    <div>
      <Header />
      <Navbar />
      <main className={styles.pageWrapper}>
        <div className={styles.overviewSection}>
          <StatsOverview stats={statsData} loading={isLoading.page} />
        </div>
        <div className={styles.mainContent}>
          <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Lịch Giao Dịch</h3>
              <DateRangeNavigator
                currentDate={currentDate}
                onDateChange={handleDateChange}
                period={period}
                onPeriodChange={handlePeriodChange}
              />
            </div>
            <TransactionCalendar
              calendarData={calendarData}
              currentDate={currentDate}
            />
          </div>

          <div className={styles.contentCard}>
            <fieldset
              className={styles.filterFieldset}
              disabled={isLoading.filters}
            >
              <legend className={styles.fieldsetLegend}>
                <FontAwesomeIcon
                  icon={faFilter}
                  className={styles.legendIcon}
                />
                Bộ lọc giao dịch
              </legend>
              <TransactionFilterPanel
                filters={tempFilters}
                onFilterFieldChange={handleFilterFieldChange}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
                categories={categoryList}
                accounts={accountList}
              />
            </fieldset>
            <div className={styles.listSection}>
              <TransactionList
                transactions={transactions}
                pagination={pagination}
                isLoading={isLoading.page}
                error={error}
                onPageChange={handlePageChange}
                onEditRequest={handleEditRequest}
                onDeleteRequest={handleDeleteRequest}
              />
            </div>
          </div>
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
      />
      <Footer />
    </div>
  );
};

export default TransactionsPage;
