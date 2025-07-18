import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
// Components
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import HeaderCard from "../components/Common/HeaderCard";
import Button from "../components/Common/Button";
import DateRangeNavigator from "../components/Common/DateRangeNavigator";
import PageContentContainer from "../components/Common/PageContentContainer";
// Chart Components
import IncomeExpenseTrendChart from "../components/DetailedAnalyticsSection/IncomeExpenseTrendChart";
import CategoryExpenseChart from "../components/DetailedAnalyticsSection/CategoryExpenseChart";
import CategoryAnalysisChart from "../components/Categories/CategoryAnalysisChart";
import TransactionsList from "../components/Statistics/TransactionsList";
import CategoryStatsTable from "../components/Statistics/CategoryStatsTable";
import FinancialInsights from "../components/Statistics/FinancialInsights";
import LoadingState from "../components/Common/LoadingState";
// API Services
import statisticsService from "../api/statisticsService";
import { getDetailedAnalyticsData } from "../api/analyticsService";
import { getTransactions } from "../api/transactionsService";
// Utilities
import { getYear, getMonth, startOfWeek, format } from "date-fns";
import { getGreeting, getFullDate } from "../utils/timeHelpers";
// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartBar,
  faArrowTrendUp, // <--- Sửa thành tên này
  faArrowTrendDown,
  faEquals,
  faChartPie,
  faChartLine,
  faList,
  faSync,
} from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/StatisticsPage.module.css";

const StatisticsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State cho user data
  const [userData, setUserData] = useState(null);

  // State cho bộ lọc và điều hướng
  const [currentDate, setCurrentDate] = useState(new Date());
  const [period, setPeriod] = useState("month");
  const [activeTab, setActiveTab] = useState("overview"); // overview, structure, trends, transactions
  const [activeSubTab, setActiveSubTab] = useState("expense"); // expense, income cho structure tab

  // State cho dữ liệu thống kê
  const [summaryStats, setSummaryStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [transactionFilter, setTransactionFilter] = useState(null);

  // State cho loading và error
  const [isLoading, setIsLoading] = useState({
    summary: true,
    trends: true,
    structure: true,
    transactions: false,
  });
  const [error, setError] = useState("");

  // Load user data
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUserData(JSON.parse(storedUser));
  }, []);

  // Khởi tạo tab từ URL params
  useEffect(() => {
    const tab = searchParams.get("tab");
    const subTab = searchParams.get("subTab");
    if (
      tab &&
      ["overview", "structure", "trends", "transactions"].includes(tab)
    ) {
      setActiveTab(tab);
    }
    if (subTab && ["expense", "income"].includes(subTab)) {
      setActiveSubTab(subTab);
    }
  }, [searchParams]);

  // Helper functions
  const getDateRangeParams = useCallback(() => {
    const year = getYear(currentDate);
    const month = getMonth(currentDate) + 1;
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

    let startDate, endDate;

    if (period === "week") {
      startDate = format(weekStart, "yyyy-MM-dd");
      endDate = format(
        new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
      );
    } else if (period === "month") {
      startDate = format(new Date(year, month - 1, 1), "yyyy-MM-dd");
      endDate = format(new Date(year, month, 0), "yyyy-MM-dd");
    } else if (period === "year") {
      startDate = format(new Date(year, 0, 1), "yyyy-MM-dd");
      endDate = format(new Date(year, 11, 31), "yyyy-MM-dd");
    }

    return { startDate, endDate, year, month };
  }, [currentDate, period]);

  // Fetch summary statistics
  const fetchSummaryStats = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, summary: true }));
    try {
      const { startDate, endDate } = getDateRangeParams();
      const data = await statisticsService.getSummaryStats({
        startDate,
        endDate,
      });
      setSummaryStats(data);
    } catch (err) {
      console.error("Error fetching summary stats:", err);
      setError("Không thể tải dữ liệu tổng quan");
    } finally {
      setIsLoading((prev) => ({ ...prev, summary: false }));
    }
  }, [getDateRangeParams]);

  // Fetch trend and category data
  const fetchAnalyticsData = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, trends: true, structure: true }));
    try {
      const { trendData, categoryData, totalExpense } =
        await getDetailedAnalyticsData(period, currentDate);

      // Cũng fetch dữ liệu thu nhập để hiển thị trong structure tab
      const { year, month } = getDateRangeParams();
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

      let incomeParams = {};
      if (period === "week") {
        incomeParams = {
          period: "week",
          date: format(weekStart, "yyyy-MM-dd"),
          type: "THUNHAP",
        };
      } else if (period === "month") {
        incomeParams = { period: "month", year, month, type: "THUNHAP" };
      } else if (period === "year") {
        incomeParams = { period: "year", year, type: "THUNHAP" };
      }

      const incomeData = await statisticsService.getCategoryData(incomeParams);
      const totalIncome = incomeData.reduce((sum, item) => sum + item.value, 0);

      setTrendData(trendData);
      setCategoryData({
        expense: categoryData || [],
        income: incomeData || [],
        totalExpense,
        totalIncome,
      });
      setTotalAmount(activeSubTab === "expense" ? totalExpense : totalIncome);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError("Không thể tải dữ liệu phân tích");
    } finally {
      setIsLoading((prev) => ({ ...prev, trends: false, structure: false }));
    }
  }, [period, currentDate, getDateRangeParams, activeSubTab]);

  // Fetch transactions with filter
  const fetchTransactions = useCallback(
    async (categoryFilter = null) => {
      setIsLoading((prev) => ({ ...prev, transactions: true }));
      try {
        const { startDate, endDate } = getDateRangeParams();
        const params = {
          page: 1,
          limit: 50,
          startDate,
          endDate,
          ...(categoryFilter && { categoryId: categoryFilter }),
        };

        const response = await getTransactions(
          params.page,
          params.limit,
          params
        );
        setTransactions(response.data.data || []);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setIsLoading((prev) => ({ ...prev, transactions: false }));
      }
    },
    [getDateRangeParams]
  );

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchSummaryStats();
    fetchAnalyticsData();
    if (activeTab === "transactions") {
      fetchTransactions(transactionFilter);
    }
  }, [
    period,
    currentDate,
    activeTab,
    fetchSummaryStats,
    fetchAnalyticsData,
    fetchTransactions,
    transactionFilter,
  ]);

  // Handlers
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("tab", tab);
      return newParams;
    });
  };

  const handleSubTabChange = (subTab) => {
    setActiveSubTab(subTab);
    setTotalAmount(
      subTab === "expense"
        ? categoryData.totalExpense
        : categoryData.totalIncome
    );
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("subTab", subTab);
      return newParams;
    });
  };

  const handleCategorySelect = (categoryId) => {
    setTransactionFilter(categoryId);
    if (activeTab !== "transactions") {
      handleTabChange("transactions");
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
  };

  const clearTransactionFilter = () => {
    setTransactionFilter(null);
    fetchTransactions(null);
  };

  const refreshData = () => {
    fetchSummaryStats();
    fetchAnalyticsData();
    if (activeTab === "transactions") {
      fetchTransactions(transactionFilter);
    }
  };

  // Helper function to get dynamic title
  const getDynamicTitle = () => {
    const periodText =
      period === "week" ? "tuần" : period === "month" ? "tháng" : "năm";
    const dateText =
      period === "week"
        ? format(startOfWeek(currentDate, { weekStartsOn: 1 }), "dd/MM/yyyy")
        : period === "month"
          ? format(currentDate, "MM/yyyy")
          : format(currentDate, "yyyy");
    return `Phân tích chi tiết ${periodText} ${dateText}`;
  };

  // Get trend info for summary stats
  const getTrendInfo = (current, previous) => {
    if (!previous || previous === 0)
      return {
        icon: faEquals,
        color: "#6b7280",
        text: "Không có dữ liệu trước",
      };

    const change = ((current - previous) / previous) * 100;
    if (change > 0) {
      return {
        icon: faArrowTrendUp,
        color: "#10b981",
        text: `+${change.toFixed(1)}%`,
      };
    } else if (change < 0) {
      return {
        icon: faArrowTrendDown,
        color: "#ef4444",
        text: `${change.toFixed(1)}%`,
      };
    } else {
      return { icon: faEquals, color: "#6b7280", text: "0%" };
    }
  };

  // Check if this is the initial load
  const isInitialLoading =
    !summaryStats &&
    (isLoading.summary || isLoading.trends || isLoading.structure);

  return (
    <div className={styles.pageContainer}>
      <Header userName={userData?.name} userAvatar={userData?.avatarUrl} />
      <Navbar />

      <main className={styles.pageWrapper}>
        <div className={styles.contentContainer}>
          {/* Show initial loading state */}
          {isInitialLoading ? (
            <>
              <div className={styles.header}>
                <h1 className={styles.pageTitle}>
                  <FontAwesomeIcon icon={faChartLine} /> Thống Kê & Phân Tích
                </h1>
                <p className={styles.pageDescription}>
                  Tổng quan chi tiết về tình hình tài chính của bạn
                </p>
              </div>
              <LoadingState
                message="Đang tải dữ liệu thống kê..."
                showChart={true}
              />
            </>
          ) : (
            <>
              {/* Header Card với tổng quan và điều khiển */}
              <HeaderCard
                gridIcon={<FontAwesomeIcon icon={faChartBar} />}
                gridTitle={`${getGreeting()}, ${userData?.name || "Bạn"}!`}
                gridSubtitle={getDynamicTitle()}
                gridStats={null}
                gridInfo={
                  <div className={styles.headerInfo}>
                    <div className={styles.contextRow}>
                      <span className={styles.contextText}>
                        Dữ liệu được cập nhật: {getFullDate()}
                      </span>
                    </div>
                  </div>
                }
                gridAction={
                  <Button
                    onClick={refreshData}
                    icon={<FontAwesomeIcon icon={faSync} />}
                    variant="secondary"
                    size="small"
                  >
                    Làm mới
                  </Button>
                }
              />

              {/* Tabs Navigation wrapped in PageContentContainer */}
              <PageContentContainer
                title="Thống Kê & Phân Tích"
                titleIcon={faChartLine}
                titleIconColor="#3f51b5"
                showDateFilter={true}
                dateProps={{
                  period,
                  currentDate,
                  onPeriodChange: handlePeriodChange,
                  onDateChange: handleDateChange,
                }}
                // headerExtra={
                //   <Button
                //     onClick={refreshData}
                //     icon={<FontAwesomeIcon icon={faSync} />}
                //     variant="secondary"
                //     size="small"
                //   >
                //     Làm mới
                //   </Button>
                // }
                customLayout={true}
              >
                {/* Stats Cards Row - Hiển thị 3 card nằm ngang */}
                <div className={styles.statsCardsRow}>
                  {summaryStats && (
                    <>
                      {/* Thu nhập */}
                      <div className={`${styles.statCard} ${styles.income}`}>
                        <div className={styles.cardIconWrapper}>
                          <FontAwesomeIcon
                            icon={faArrowTrendUp}
                            className={styles.cardIcon}
                          />
                        </div>
                        <div className={styles.cardContent}>
                          <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>Thu nhập</h3>
                            <div className={styles.comparison}>
                              <FontAwesomeIcon
                                icon={
                                  getTrendInfo(summaryStats.totalIncome, 0).icon
                                }
                              />
                              <span>
                                {getTrendInfo(summaryStats.totalIncome, 0).text}
                              </span>
                            </div>
                          </div>
                          <p className={styles.cardAmount}>
                            {summaryStats.totalIncome?.toLocaleString(
                              "vi-VN"
                            ) || "0"}{" "}
                            ₫
                          </p>
                        </div>
                      </div>

                      {/* Chi tiêu */}
                      <div className={`${styles.statCard} ${styles.expense}`}>
                        <div className={styles.cardIconWrapper}>
                          <FontAwesomeIcon
                            icon={faArrowTrendDown}
                            className={styles.cardIcon}
                          />
                        </div>
                        <div className={styles.cardContent}>
                          <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>Chi tiêu</h3>
                            <div className={styles.comparison}>
                              <FontAwesomeIcon
                                icon={
                                  getTrendInfo(summaryStats.totalExpense, 0)
                                    .icon
                                }
                              />
                              <span>
                                {
                                  getTrendInfo(summaryStats.totalExpense, 0)
                                    .text
                                }
                              </span>
                            </div>
                          </div>
                          <p className={styles.cardAmount}>
                            {summaryStats.totalExpense?.toLocaleString(
                              "vi-VN"
                            ) || "0"}{" "}
                            ₫
                          </p>
                        </div>
                      </div>

                      {/* Dòng tiền */}
                      <div className={`${styles.statCard} ${styles.cashFlow}`}>
                        <div className={styles.cardIconWrapper}>
                          <FontAwesomeIcon
                            icon={faChartLine}
                            className={styles.cardIcon}
                          />
                        </div>
                        <div className={styles.cardContent}>
                          <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>Dòng tiền ròng</h3>
                            <div className={styles.comparison}>
                              <FontAwesomeIcon
                                icon={
                                  getTrendInfo(summaryStats.cashFlow, 0).icon
                                }
                              />
                              <span>
                                {getTrendInfo(summaryStats.cashFlow, 0).text}
                              </span>
                            </div>
                          </div>
                          <p className={styles.cardAmount}>
                            {summaryStats.cashFlow?.toLocaleString("vi-VN") ||
                              "0"}{" "}
                            ₫
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className={styles.analysisSection}>
                  <div className={styles.tabs}>
                    <button
                      className={
                        activeTab === "overview" ? styles.activeTab : ""
                      }
                      onClick={() => handleTabChange("overview")}
                    >
                      <FontAwesomeIcon icon={faChartBar} /> Tổng quan
                    </button>
                    <button
                      className={
                        activeTab === "structure" ? styles.activeTab : ""
                      }
                      onClick={() => handleTabChange("structure")}
                    >
                      <FontAwesomeIcon icon={faChartPie} /> Cơ cấu
                    </button>
                    <button
                      className={activeTab === "trends" ? styles.activeTab : ""}
                      onClick={() => handleTabChange("trends")}
                    >
                      <FontAwesomeIcon icon={faChartLine} /> Xu hướng
                    </button>
                    <button
                      className={
                        activeTab === "transactions" ? styles.activeTab : ""
                      }
                      onClick={() => handleTabChange("transactions")}
                    >
                      <FontAwesomeIcon icon={faList} /> Giao dịch
                    </button>
                  </div>

                  <div className={styles.tabContent}>
                    {/* Tab: Tổng quan */}
                    {activeTab === "overview" && (
                      <div>
                        {/* Financial Insights */}
                        <FinancialInsights
                          summaryStats={summaryStats}
                          categoryData={categoryData}
                          trendData={trendData}
                          period={period}
                        />

                        {/* Trend Chart */}
                        <div style={{ marginTop: "32px" }}>
                          <h2 className={styles.sectionTitle}>
                            Biểu đồ xu hướng thu chi
                          </h2>
                          <IncomeExpenseTrendChart
                            data={trendData}
                            period={period}
                            loading={isLoading.trends}
                            error={error}
                          />
                        </div>
                      </div>
                    )}

                    {/* Tab: Cơ cấu */}
                    {activeTab === "structure" && (
                      <div>
                        <div className={styles.structureChartContainer}>
                          <div className={styles.subTabs}>
                            <button
                              className={
                                activeSubTab === "expense"
                                  ? styles.activeSubTab
                                  : ""
                              }
                              onClick={() => handleSubTabChange("expense")}
                            >
                              Chi tiêu
                            </button>
                            <button
                              className={
                                activeSubTab === "income"
                                  ? styles.activeSubTab
                                  : ""
                              }
                              onClick={() => handleSubTabChange("income")}
                            >
                              Thu nhập
                            </button>
                          </div>

                          <div className={styles.structureLayout}>
                            <div className={styles.chartColumn}>
                              <CategoryAnalysisChart
                                data={
                                  activeSubTab === "expense"
                                    ? categoryData.expense
                                    : categoryData.income
                                }
                                total={totalAmount}
                                loading={isLoading.structure}
                                error={error}
                                categoryType={activeSubTab}
                                onActiveCategoryChange={(category) => {
                                  if (category) {
                                    handleCategorySelect(category.id);
                                  }
                                }}
                              />
                            </div>

                            <div className={styles.listColumn}>
                              <CategoryStatsTable
                                data={
                                  activeSubTab === "expense"
                                    ? categoryData.expense
                                    : categoryData.income
                                }
                                type={activeSubTab}
                                total={totalAmount}
                                loading={isLoading.structure}
                                onCategoryClick={(category) =>
                                  handleCategorySelect(category.id)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab: Xu hướng */}
                    {activeTab === "trends" && (
                      <div>
                        <h2 className={styles.sectionTitle}>
                          Phân tích xu hướng chi tiết
                        </h2>
                        <div className={styles.chartsRow}>
                          <div className={styles.trendChartContainer}>
                            <IncomeExpenseTrendChart
                              data={trendData}
                              period={period}
                              loading={isLoading.trends}
                              error={error}
                            />
                          </div>

                          <div className={styles.categoryChartContainer}>
                            <CategoryExpenseChart
                              data={categoryData.expense}
                              total={categoryData.totalExpense}
                              loading={isLoading.structure}
                              error={error}
                              onSliceClick={(category) =>
                                handleCategorySelect(category.id)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab: Giao dịch */}
                    {activeTab === "transactions" && (
                      <TransactionsList
                        transactions={transactions}
                        loading={isLoading.transactions}
                        error={error}
                        filter={transactionFilter}
                        onClearFilter={clearTransactionFilter}
                        onTransactionClick={(transaction) => {
                          console.log("Transaction clicked:", transaction);
                          // Có thể navigate đến trang chi tiết giao dịch
                        }}
                      />
                    )}
                  </div>
                </div>
              </PageContentContainer>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StatisticsPage;
