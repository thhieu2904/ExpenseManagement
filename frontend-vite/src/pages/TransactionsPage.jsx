// Mở và THAY THẾ TOÀN BỘ file: frontend-vite/src/pages/TransactionsPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { startOfWeek, endOfWeek } from "date-fns";

// Services & Config
import axiosInstance from "../api/axiosConfig";
import { deleteTransaction } from "../api/transactionsService";

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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/TransactionsPage.module.css";

const TransactionsPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [period, setPeriod] = useState("month");
  const [statsData, setStatsData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });
  const [calendarData, setCalendarData] = useState({});
  const [filters, setFilters] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // API Call Abstraction
  const fetchDataForPage = useCallback(
    async (date, viewPeriod, currentFilters, page = 1) => {
      setIsLoading(true);
      setError("");

      const getRequestParams = () => {
        let params = { page, limit: 10, ...currentFilters };
        if (viewPeriod === "week") {
          params.startDate = startOfWeek(date, {
            weekStartsOn: 1,
          }).toISOString();
          params.endDate = endOfWeek(date, { weekStartsOn: 1 }).toISOString();
        } else if (viewPeriod === "year") {
          params.year = date.getFullYear();
        } else {
          // month
          params.year = date.getFullYear();
          params.month = date.getMonth() + 1;
        }
        return params;
      };

      const overviewParams = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      };

      try {
        const [statsRes, calendarRes, transactionsRes] = await Promise.all([
          axiosInstance.get("/statistics/overview", { params: overviewParams }),
          axiosInstance.get("/statistics/calendar", { params: overviewParams }),
          axiosInstance.get("/transactions", { params: getRequestParams() }),
        ]);

        setStatsData(statsRes.data);
        setCalendarData(calendarRes.data);
        setTransactions(transactionsRes.data.data);
        setPagination({
          currentPage: transactionsRes.data.currentPage,
          totalPages: transactionsRes.data.totalPages,
          totalCount: transactionsRes.data.totalCount,
        });
      } catch (err) {
        setError("Không thể tải dữ liệu trang. Vui lòng thử lại.");
        console.error("Fetch data error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Effect to sync URL params to filter state on initial load
  useEffect(() => {
    const categoryId = searchParams.get("categoryId");
    const accountId = searchParams.get("accountId");
    if (categoryId || accountId) {
      const initialFilters = {};
      if (categoryId) initialFilters.categoryId = categoryId;
      if (accountId) initialFilters.accountId = accountId;
      setFilters((prev) => ({ ...prev, ...initialFilters }));
      // Clean up URL params after applying them
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Main data fetching effect
  useEffect(() => {
    fetchDataForPage(currentDate, period, filters, pagination.currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, period, filters, pagination.currentPage]);

  // Handlers
  const handlePageChange = (newPage) =>
    setPagination((p) => ({ ...p, currentPage: newPage }));
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
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
      fetchDataForPage(currentDate, period, filters, pagination.currentPage);
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
    fetchDataForPage(currentDate, period, filters, pagination.currentPage);
  };

  return (
    <div>
      <Header />
      <Navbar />
      <main className={styles.pageWrapper}>
        <div className={styles.overviewSection}>
          <StatsOverview stats={statsData} loading={isLoading} />
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
            <fieldset className={styles.filterFieldset}>
              <legend className={styles.fieldsetLegend}>
                <FontAwesomeIcon
                  icon={faFilter}
                  className={styles.legendIcon}
                />
                Bộ lọc giao dịch
              </legend>
              <TransactionFilterPanel
                onFilterChange={handleFilterChange}
                initialFilters={filters}
              />
            </fieldset>
            <div className={styles.listSection}>
              <TransactionList
                transactions={transactions}
                pagination={pagination}
                isLoading={isLoading}
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
