// Mở và THAY THẾ TOÀN BỘ file: frontend-vite/src/pages/TransactionsPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import styles from "../styles/TransactionsPage.module.css";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { startOfWeek, endOfWeek } from "date-fns";
import { useSearchParams } from "react-router-dom";

// Import các component chung
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import StatsOverview from "../components/StatsOverview/StatsOverview";
import DateRangeNavigator from "../components/Common/DateRangeNavigator";

// Import các component con của trang
import TransactionCalendar from "../components/Transactions/TransactionCalendar";
import TransactionFilterPanel from "../components/Transactions/TransactionFilterPanel";
import TransactionList from "../components/Transactions/TransactionList";
import AddEditTransactionModal from "../components/Transactions/AddEditTransactionModal";
import ConfirmDialog from "../components/Common/ConfirmDialog";

const TransactionsPage = () => {
  // --- STATE MANAGEMENT ---
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

  // State cho modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams] = useSearchParams();

  // --- API CALLS ---
  const fetchDataForPage = async (date, period, currentFilters, page = 1) => {
    setIsLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    const params = {
      page,
      limit: 10,
      ...currentFilters,
    };
    if (period === "week") {
      const startDate = startOfWeek(date, { weekStartsOn: 1 });
      const endDate = endOfWeek(date, { weekStartsOn: 1 });
      params.startDate = startDate.toISOString();
      params.endDate = endDate.toISOString();
    } else if (period === "year") {
      params.year = date.getFullYear();
    } else {
      params.year = date.getFullYear();
      params.month = date.getMonth() + 1;
    }

    const overviewParams = {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    };

    try {
      const [statsRes, calendarRes, transactionsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/statistics/overview", {
          headers: { Authorization: `Bearer ${token}` },
          params: overviewParams,
        }),
        axios.get("http://localhost:5000/api/statistics/calendar", {
          headers: { Authorization: `Bearer ${token}` },
          params: overviewParams,
        }),
        axios.get("http://localhost:5000/api/transactions", {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }),
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
  };

  useEffect(() => {
    // Khi mount, nếu có query param accountId thì set vào filters
    const accountId = searchParams.get("accountId");
    if (accountId) {
      setFilters((prev) => ({ ...prev, accountId }));
      setPagination((p) => ({ ...p, currentPage: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDataForPage(currentDate, period, filters, pagination.currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, period, filters, pagination.currentPage]);

  // --- HANDLERS ---
  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
    setPagination((p) => ({ ...p, currentPage: 1 }));
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setCurrentDate(new Date());
    setPagination((p) => ({ ...p, currentPage: 1 }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination((p) => ({ ...p, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((p) => ({ ...p, currentPage: newPage }));
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
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/transactions/${transactionToDelete}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchDataForPage(currentDate, period, filters, pagination.currentPage);
    } catch (err) {
      alert("Xóa giao dịch thất bại!");
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
  console.log(
    "GIÁ TRỊ STATE 'calendarData' TRƯỚC KHI TRUYỀN XUỐNG:",
    calendarData
  );

  return (
    <div>
      <Header />
      <Navbar />
      <main className={styles.pageWrapper}>
        {/* Phần tổng quan thống kê (giữ nguyên) */}
        <div className={styles.overviewSection}>
          <StatsOverview stats={statsData} loading={isLoading} />
        </div>

        {/* Phần nội dung chính với layout xếp chồng theo chiều dọc */}
        <div className={styles.mainContent}>
          {/* ===== CARD 1: LỊCH GIAO DỊCH (Nằm ở trên) ===== */}
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

          {/* ===== CARD 2: BỘ LỌC VÀ DANH SÁCH (Nằm ở dưới) ===== */}
          <div className={styles.contentCard}>
            <fieldset className={styles.filterFieldset}>
              <legend className={styles.fieldsetLegend}>
                <FontAwesomeIcon
                  icon={faFilter}
                  className={styles.legendIcon}
                />
                Bộ lọc giao dịch
              </legend>
              <TransactionFilterPanel onFilterChange={handleFilterChange} />
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
