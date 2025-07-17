import React, { useState, useEffect, useCallback } from "react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import DateRangeNavigator from "../components/Common/DateRangeNavigator";
import TotalBalanceDisplay from "../components/Accounts/TotalBalanceDisplay";
import AccountList from "../components/Accounts/AccountList";
import AddEditAccountModal from "../components/Accounts/AddEditAccountModal";
import HeaderCard from "../components/Common/HeaderCard";
import HeaderTitle from "../components/Common/HeaderTitle";
import SummaryWidget from "../components/Common/SummaryWidget";
import PageContentContainer from "../components/Common/PageContentContainer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet, faPlus, faChartPie, faHandHoldingDollar } from "@fortawesome/free-solid-svg-icons";
import Button from "../components/Common/Button";

import styles from "../styles/AccountPage.module.css";
import headerStyles from "../components/Common/HeaderCard.module.css";
import {
  getAccounts,
  addAccount,
  editAccount,
  deleteAccount,
  getTransactionCountByAccount,
} from "../api/accountsService";
import statisticsService from "../api/statisticsService";
import { getProfile } from "../api/profileService";

const AccountPage = () => {
  // --- State quản lý chung ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [highlightedAccountId, setHighlightedAccountId] = useState(null);
  const [transactionCounts, setTransactionCounts] = useState({});
  const [summaryData, setSummaryData] = useState({
    income: { amount: 0, comparison: "..." },
    expense: { amount: 0, comparison: "..." },
  });
  const [userProfile, setUserProfile] = useState(null);

  // THAY ĐỔI: Chuyển sang quản lý state bằng period và currentDate
  const [currentDate, setCurrentDate] = useState(new Date());
  const [period, setPeriod] = useState("month");

  // CẬP NHẬT: Hàm gọi API sử dụng period và currentDate
  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
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
      if (startDate && endDate) {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      const queryParams = {
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
      };

      // Gọi đồng thời nhiều API
      const [accountsData, summary, counts, profile] = await Promise.all([
        getAccounts(queryParams),
        statisticsService.getOverviewStats(queryParams),
        Promise.all(
          (await getAccounts(queryParams)).map((acc) =>
            getTransactionCountByAccount({
              accountId: acc.id,
              ...queryParams,
            }).then((count) => ({ [acc.id]: count }))
          )
        ).then((results) =>
          results.reduce((acc, val) => ({ ...acc, ...val }), {})
        ),
        getProfile().catch(() => null), // Không throw lỗi nếu không lấy được profile
      ]);

      setAccounts(accountsData || []);
      setUserProfile(profile?.data || null);
      if (summary && summary.income && summary.expense) {
        setSummaryData({
          income: {
            amount: summary.income.amount,
            comparison: summary.income.changeDescription,
          },
          expense: {
            amount: summary.expense.amount,
            comparison: summary.expense.changeDescription,
          },
        });
      }
      setTransactionCounts(counts);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Không thể tải dữ liệu cho trang nguồn tiền."
      );
    } finally {
      setIsLoading(false);
    }
  }, [period, currentDate]);

  useEffect(() => {
    fetchPageData();
  }, [refreshTrigger, fetchPageData]);

  const handleForceRefresh = () => setRefreshTrigger((prev) => prev + 1);

  // CÁC HÀM HANDLER MỚI cho DateRangeNavigator
  const handleDateChange = (newDate) => setCurrentDate(newDate);
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setCurrentDate(new Date());
  };

  // --- Các hàm xử lý Modal (không đổi) ---
  const handleOpenAddModal = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleFormSubmit = async (formData) => {
    const isEditing = !!editingAccount;
    const payload = {
      name: formData.name,
      type: formData.type === "cash" ? "TIENMAT" : "THENGANHANG",
      initialBalance: parseFloat(formData.balance) || 0,
      bankName: formData.bankName,
      accountNumber: formData.accountNumber,
    };
    if (isEditing) {
      delete payload.initialBalance;
      delete payload.type;
    }
    try {
      if (isEditing) {
        await editAccount(editingAccount.id, payload);
      } else {
        await addAccount(payload);
      }
      handleCloseModal();
      handleForceRefresh();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Có lỗi xảy ra khi lưu.";
      console.error("Lỗi khi lưu nguồn tiền:", errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Tính tổng số dư từ danh sách tài khoản đã được API trả về
  const totalBalance = accounts.reduce(
    (sum, acc) => sum + (acc.balance || 0),
    0
  );

  // Hàm xóa tài khoản
  const handleDeleteAccount = async (accountId) => {
    try {
      await deleteAccount(accountId);
      handleForceRefresh();
    } catch (err) {
      console.error("Lỗi khi xóa nguồn tiền:", err);
    }
  };

  // === Helper functions cho header ===
  // Tạo lời chào dựa trên thời gian
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  // Tạo ngữ cảnh thông minh
  const getSmartContext = () => {
    if (isLoading) return "Đang tải dữ liệu tài chính...";
    
    if (!summaryData || !summaryData.income || !summaryData.expense) {
      return "Hãy bắt đầu quản lý tài chính của bạn.";
    }
    
    const balance = summaryData.income.amount - summaryData.expense.amount;
    const accountCount = accounts.length;
    
    if (balance > 0) {
      return `Tình hình tài chính tích cực! Bạn có ${accountCount} nguồn tiền đang hoạt động.`;
    } else if (balance < 0) {
      return `Cần chú ý chi tiêu. Quản lý ${accountCount} tài khoản một cách thông minh hơn nhé!`;
    } else {
      return `Tài chính cân bằng với ${accountCount} nguồn tiền. Rất tốt!`;
    }
  };

  const getMoodEmoji = () => {
    if (isLoading || !summaryData) return "📊";
    
    const balance = summaryData.income.amount - summaryData.expense.amount;
    if (balance > 0) return "💚";
    if (balance < 0) return "💛";
    return "💙";
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Header />
      <Navbar />
      <main className={styles.pageWrapper}>
        {/* Header với layout 2x2 grid */}
        <HeaderCard variant="grid" className={styles.accountPageHeader}>
          {/* Ô 1,1: Greeting Section */}
          <div className={`${headerStyles.gridItem1_1} ${styles.greetingSection}`}>
            <div className={styles.greetingIcon}>
              <FontAwesomeIcon icon={faHandHoldingDollar} />
            </div>
            <div className={styles.greetingText}>
              <HeaderTitle className={styles.mainGreeting}>
                {getGreeting()}, {userProfile?.fullname || "Bạn"}!
              </HeaderTitle>
              <span className={styles.subtitle}>
                Quản lý nguồn tiền thông minh
              </span>
            </div>
          </div>

          {/* Ô 1,2: SummaryWidget (compact) */}
          <div className={`${headerStyles.gridItem1_2} ${styles.summarySection}`}>
            <SummaryWidget
              incomeData={summaryData?.income}
              expenseData={summaryData?.expense}
              isLoading={isLoading}
              variant="compact"
            />
          </div>

          {/* Ô 2,1: Context Section */}
          <div className={`${headerStyles.gridItem2_1} ${styles.contextSection}`}>
            <div className={styles.smartContext}>
              <span className={styles.contextText}>
                {getSmartContext()}
              </span>
              <span className={styles.moodEmoji}>
                {getMoodEmoji()}
              </span>
            </div>
            <div className={styles.miniStats}>
              <span>{new Date().toLocaleDateString('vi-VN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>

          {/* Ô 2,2: Action Button (căn dưới) */}
          <div className={`${headerStyles.gridItem2_2} ${styles.actionSection}`}>
            <Button
              onClick={handleOpenAddModal}
              icon={<FontAwesomeIcon icon={faPlus} />}
              variant="primary"
              className={styles.addButton}
            >
              Thêm Nguồn Tiền
            </Button>
          </div>
        </HeaderCard>

        <PageContentContainer
          title="Bảng Điều Khiển Tài Chính"
          titleIcon={faChartPie}
          titleIconColor="#3f51b5"
          dateProps={{
            period,
            currentDate,
            onDateChange: handleDateChange,
            onPeriodChange: handlePeriodChange
          }}
        >
          <TotalBalanceDisplay
            accounts={accounts}
            isLoading={isLoading}
            highlightedAccountId={highlightedAccountId}
            onHoverAccount={setHighlightedAccountId}
          />
          <AccountList
            accounts={accounts}
            totalBalance={totalBalance}
            isLoading={isLoading}
            error={error}
            onEditRequest={handleOpenEditModal}
            onDeleteAccount={handleDeleteAccount}
            highlightedAccountId={highlightedAccountId}
            onHoverAccount={setHighlightedAccountId}
            transactionCounts={transactionCounts}
          />
        </PageContentContainer>
      </main>
      {isModalOpen && (
        <AddEditAccountModal
          isOpen={isModalOpen}
          mode={editingAccount ? "edit" : "add"}
          initialData={editingAccount}
          onClose={handleCloseModal}
          onSubmit={handleFormSubmit}
        />
      )}
      <Footer />
    </div>
  );
};

export default AccountPage;
