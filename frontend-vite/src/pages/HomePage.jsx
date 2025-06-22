// Mở và THAY THẾ file: frontend-vite/src/pages/HomePage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import StatsOverview from "../components/StatsOverview/StatsOverview";
import DetailedAnalyticsSection from "../components/DetailedAnalyticsSection/DetailedAnalyticsSection";
import RecentTransactions from "../components/RecentTransactions/RecentTransactions";
import Footer from "../components/Footer/Footer";
import { getStatsOverview } from "../api/homePageService";
import { getTransactions, deleteTransaction } from "../api/transactionsService";

const ITEMS_PER_PAGE = 5;

const HomePage = () => {
  const [userData, setUserData] = useState({ name: "", avatarUrl: null });
  const [statsData, setStatsData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    hasMore: true,
  });
  const [transactionFilters, setTransactionFilters] = useState({});
  const [isLoading, setIsLoading] = useState({
    stats: true,
    transactions: true,
  });
  const [error, setError] = useState("");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const isInitialMount = useRef(true);

  // --- API Abstraction ---
  const fetchStats = useCallback(async () => {
    try {
      const response = await getStatsOverview();
      setStatsData(response.data);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu tổng quan:", err);
    }
  }, []);

  const fetchTransactions = useCallback(
    async (page, filters, shouldRefresh) => {
      setIsLoading((prev) => ({ ...prev, transactions: true }));
      if (page === 1) setError("");

      try {
        const response = await getTransactions(page, ITEMS_PER_PAGE, filters);
        const { data, totalPages, currentPage } = response.data;
        if (data) {
          setTransactions((prev) =>
            shouldRefresh ? data : [...prev, ...data]
          );
          setPagination({ currentPage, hasMore: currentPage < totalPages });
        }
      } catch (err) {
        setError("Không thể tải danh sách giao dịch.");
        console.error("Lỗi fetchTransactions:", err);
      } finally {
        setIsLoading((prev) => ({ ...prev, transactions: false }));
      }
    },
    []
  );

  const refreshStatsAndTransactions = useCallback(
    async (filters = {}) => {
      setIsLoading({ stats: true, transactions: true });
      await Promise.all([fetchStats(), fetchTransactions(1, filters, true)]);
      setIsLoading({ stats: false, transactions: false });
    },
    [fetchStats, fetchTransactions]
  );

  // --- Initial Data Load ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUserData(JSON.parse(storedUser));

    refreshStatsAndTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ SỬA: Effect 2: Tải lại giao dịch KHI BỘ LỌC THAY ĐỔI
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchTransactions(1, transactionFilters, true);
  }, [transactionFilters, fetchTransactions]);

  // --- Handlers ---
  const handleLoadMore = () => {
    if (!isLoading.transactions && pagination.hasMore) {
      fetchTransactions(pagination.currentPage + 1, transactionFilters, false);
    }
  };

  const handleCategorySelectFromAnalytics = useCallback((categoryId) => {
    const newFilters = categoryId ? { categoryId } : {};
    setTransactionFilters(newFilters);
  }, []);

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
      await refreshStatsAndTransactions(transactionFilters);
    } catch (err) {
      alert("Xóa giao dịch thất bại!");
      console.error("Lỗi khi xóa giao dịch:", err);
    } finally {
      setIsConfirmOpen(false);
      setTransactionToDelete(null);
    }
  };

  const handleSubmitSuccess = async () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    await refreshStatsAndTransactions(transactionFilters);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const closeConfirm = () => {
    setIsConfirmOpen(false);
    setTransactionToDelete(null);
  };

  return (
    <div>
      <Header userName={userData.name} userAvatar={userData.avatarUrl} />
      <Navbar />
      <main style={{ padding: "20px" }}>
        <StatsOverview stats={statsData} loading={isLoading.stats} />

        <DetailedAnalyticsSection
          onCategorySelect={handleCategorySelectFromAnalytics}
        />

        <RecentTransactions
          transactions={transactions}
          isLoading={isLoading.transactions}
          error={error}
          hasMore={pagination.hasMore}
          onLoadMore={handleLoadMore}
          onEditRequest={handleEditRequest}
          onDeleteRequest={handleDeleteRequest}
          onConfirmDelete={handleConfirmDelete}
          onSubmitSuccess={handleSubmitSuccess}
          onCloseModal={closeModal}
          onCloseConfirm={closeConfirm}
          isModalOpen={isModalOpen}
          isConfirmOpen={isConfirmOpen}
          editingTransaction={editingTransaction}
        />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
