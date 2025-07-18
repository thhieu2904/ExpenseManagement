// Mở và THAY THẾ file: frontend-vite/src/pages/HomePage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import StatsOverview from "../components/StatsOverview/StatsOverview";
import DetailedAnalyticsSection from "../components/DetailedAnalyticsSection/DetailedAnalyticsSection";
import RecentTransactions from "../components/RecentTransactions/RecentTransactions";
import Footer from "../components/Footer/Footer";
import HeaderCard from "../components/Common/HeaderCard";
import Button from "../components/Common/Button";
import AddEditTransactionModal from "../components/Transactions/AddEditTransactionModal";
import { getStatsOverview } from "../api/homePageService";
import { getTransactions, deleteTransaction } from "../api/transactionsService";
import { getProfile } from "../api/profileService";
import { getGreeting, getFullDate } from "../utils/timeHelpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faHome } from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/HomePage.module.css";

const ITEMS_PER_PAGE = 5;

const HomePage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ name: "", avatarUrl: null });
  const [statsData, setStatsData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    hasMore: true,
    totalCount: 0,
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
        const { data, totalPages, currentPage, totalCount } = response.data;
        if (data) {
          setTransactions((prev) =>
            shouldRefresh ? data : [...prev, ...data]
          );
          setPagination({
            currentPage,
            hasMore: currentPage < totalPages,
            totalCount: totalCount || 0,
          });
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
    const loadUserData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUserData(JSON.parse(storedUser));
        } else {
          // Fallback: fetch from API if not in localStorage
          const profile = await getProfile();
          setUserData({
            name: profile.data.fullname,
            avatarUrl: profile.data.avatar,
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin người dùng:", error);
        // Use fallback data
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUserData(JSON.parse(storedUser));
      }
    };

    loadUserData();
    refreshStatsAndTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleCategoryClickFromTransaction = useCallback(
    (categoryId) => {
      navigate(`/categories?highlight=${categoryId}`);
    },
    [navigate]
  );

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

  const handleAddRequest = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const closeConfirm = () => {
    setIsConfirmOpen(false);
    setTransactionToDelete(null);
  };

  // Helper functions cho HeaderCard
  const getSmartContext = () => {
    if (isLoading.stats) return "Đang tải dữ liệu tài chính...";

    if (!statsData) {
      return "Hãy bắt đầu quản lý tài chính của bạn.";
    }

    const income = statsData.income?.amount || 0;
    const expense = statsData.expense?.amount || 0;
    const balance = income - expense;

    if (balance > 0) {
      return "Tình hình tài chính tích cực! Tiếp tục duy trì thói quen tốt.";
    } else if (balance < 0) {
      return "Cần chú ý chi tiêu. Hãy xem lại ngân sách của bạn.";
    } else {
      return "Tài chính cân bằng. Rất tốt!";
    }
  };

  const getMoodEmoji = () => {
    if (isLoading.stats || !statsData) return "📊";

    const income = statsData.income?.amount || 0;
    const expense = statsData.expense?.amount || 0;
    const balance = income - expense;

    if (balance > 0) return "💚";
    if (balance < 0) return "💔";
    return "💙";
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Header userName={userData.name} userAvatar={userData.avatarUrl} />
      <Navbar />

      <main className={styles.pageWrapper}>
        <div className={styles.contentContainer}>
          {/* Header Card */}
          <HeaderCard
            gridIcon={<FontAwesomeIcon icon={faHome} />}
            gridTitle={`${getGreeting()}, ${userData.name || "Bạn"}!`}
            gridSubtitle="Tổng quan tài chính cá nhân"
            gridStats={
              <StatsOverview stats={statsData} loading={isLoading.stats} />
            }
            gridInfo={
              <div className={styles.headerInfo}>
                <div className={styles.contextRow}>
                  <span className={styles.contextText}>
                    {getSmartContext()}
                  </span>
                  <span className={styles.moodEmoji}>{getMoodEmoji()}</span>
                </div>
                <span className={styles.miniStats}>{getFullDate()}</span>
              </div>
            }
            gridAction={
              <Button
                onClick={handleAddRequest}
                icon={<FontAwesomeIcon icon={faPlus} />}
                variant="primary"
              >
                Thêm Giao Dịch
              </Button>
            }
          />
          <div className={styles.mainContent}>
            {/* Main Content */}
            <DetailedAnalyticsSection
              onCategorySelect={handleCategorySelectFromAnalytics}
            />

            <RecentTransactions
              transactions={transactions}
              isLoading={isLoading.transactions}
              error={error}
              hasMore={pagination.hasMore}
              totalCount={pagination.totalCount}
              currentPage={pagination.currentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              onLoadMore={handleLoadMore}
              onEditRequest={handleEditRequest}
              onDeleteRequest={handleDeleteRequest}
              onConfirmDelete={handleConfirmDelete}
              onSubmitSuccess={handleSubmitSuccess}
              onCloseModal={closeModal}
              onCloseConfirm={closeConfirm}
              onAddRequest={handleAddRequest}
              onCategoryClick={handleCategoryClickFromTransaction}
              isModalOpen={isModalOpen}
              isConfirmOpen={isConfirmOpen}
              editingTransaction={editingTransaction}
            />
          </div>
        </div>
      </main>

      <Footer />

      {/* Modal thêm/sửa giao dịch */}
      <AddEditTransactionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmitSuccess={handleSubmitSuccess}
        mode={editingTransaction ? "edit" : "add"}
        editingTransaction={editingTransaction}
      />
    </div>
  );
};

export default HomePage;
