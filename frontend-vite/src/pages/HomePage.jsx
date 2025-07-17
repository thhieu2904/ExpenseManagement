// Mở và THAY THẾ file: frontend-vite/src/pages/HomePage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [transactionFilters, setTransactionFilters] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    hasMore: true,
    totalCount: 0,
  });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // ✅ SỬ DỤNG REACT QUERY ĐỂ FETCH DỮ LIỆU
  const {
    data: pageData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["homePage", transactionFilters, pagination.currentPage],
    queryFn: async () => {
      const [statsResponse, transactionsResponse, profile] = await Promise.all([
        getStatsOverview(),
        getTransactions(
          pagination.currentPage,
          ITEMS_PER_PAGE,
          transactionFilters
        ),
        getProfile().catch(() => null),
      ]);

      return {
        statsData: statsResponse.data,
        transactionsData: transactionsResponse.data,
        userProfile: profile?.data || null,
      };
    },
    placeholderData: (previousData) => previousData,
  });

  const {
    statsData = null,
    transactionsData = {
      data: [],
      totalPages: 0,
      currentPage: 1,
      totalCount: 0,
    },
    userProfile = null,
  } = pageData || {};

  const transactions = transactionsData.data || [];

  // Update pagination when transactionsData changes
  useEffect(() => {
    if (transactionsData) {
      setPagination({
        currentPage: transactionsData.currentPage || 1,
        hasMore: transactionsData.currentPage < transactionsData.totalPages,
        totalCount: transactionsData.totalCount || 0,
      });
    }
  }, [transactionsData]);

  // --- API Abstraction ---
  const refreshStatsAndTransactions = useCallback(async () => {
    // Refresh sẽ được xử lý bởi React Query
    await queryClient.invalidateQueries({ queryKey: ["homePage"] });
  }, [queryClient]);

  // --- Handlers ---
  const handleLoadMore = () => {
    if (!isLoading && pagination.hasMore) {
      // Logic load more sẽ cần refactor để sử dụng React Query
      console.log("Load more functionality needs refactoring for React Query");
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
    if (isLoading) return "Đang tải dữ liệu tài chính...";

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
    if (isLoading || !statsData) return "📊";

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
      <Header
        userName={userProfile?.fullname}
        userAvatar={userProfile?.avatar}
      />
      <Navbar />

      <main className={styles.pageWrapper}>
        <div className={styles.contentContainer}>
          <HeaderCard
            className={styles.homePageHeader}
            gridIcon={<FontAwesomeIcon icon={faHome} />}
            gridTitle={`${getGreeting()}, ${userProfile?.fullname || "Bạn"}!`}
            gridSubtitle="Tổng quan tài chính cá nhân"
            gridStats={
              <div className={styles.statsOverviewWrapper}>
                <StatsOverview stats={statsData} loading={isLoading} />
              </div>
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
              isLoading={isLoading}
              error={error?.message || ""}
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
