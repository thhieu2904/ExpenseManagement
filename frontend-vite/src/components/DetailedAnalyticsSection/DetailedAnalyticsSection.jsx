// frontend-vite/src/components/DetailedAnalyticsSection/DetailedAnalyticsSection.jsx
import React, { useState, useEffect, useRef } from "react";
import IncomeExpenseTrendChart from "./IncomeExpenseTrendChart";
import CategoryExpenseChart from "./CategoryExpenseChart";
import styles from "./DetailedAnalyticsSection.module.css";
import { Link } from "react-router-dom";
import { getYear, getMonth, startOfWeek } from "date-fns";
// MỚI: Import service đã được trừu tượng hóa
import { getDetailedAnalyticsData } from "../../api/analyticsService";
// MỚI: import service riêng lẻ
import statisticsService from "../../api/statisticsService";
// MỚI: Import component điều hướng
import DateRangeNavigator from "../Common/DateRangeNavigator";

const DetailedAnalyticsSection = ({ onCategorySelect }) => {
  // State cho bộ lọc thời gian
  const [currentDate, setCurrentDate] = useState(new Date());
  const [period, setPeriod] = useState("month");

  // State cho dữ liệu của cả 2 biểu đồ
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [totalExpense, setTotalExpense] = useState(0);

  // State chung cho loading và error
  const [isLoadingTrend, setIsLoadingTrend] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState(null);

  // State quản lý danh mục được chọn
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [activeCategoryName, setActiveCategoryName] = useState(null);

  const isInitialMount = useRef(true);

  // useEffect 1: Fetch CẢ HAI khi đổi khoảng thời gian (period, currentDate)
  useEffect(() => {
    const fetchBaseData = async () => {
      setIsLoadingTrend(true);
      setIsLoadingCategories(true);
      setError(null);

      try {
        const { trendData, categoryData, totalExpense } =
          await getDetailedAnalyticsData(period, currentDate, null); // Luôn fetch trend chung ban đầu
        setTrendData(trendData);
        setCategoryData(categoryData);
        setTotalExpense(totalExpense);
      } catch (err) {
        setError("Không thể tải dữ liệu.");
        console.error(err);
      } finally {
        setIsLoadingTrend(false);
        setIsLoadingCategories(false);
      }
    };

    fetchBaseData();
  }, [period, currentDate]);

  // useEffect 2: Fetch CHỈ BIỂU ĐỒ ĐƯỜNG khi chọn/bỏ chọn category
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Thông báo cho component cha về sự thay đổi category
    if (onCategorySelect) {
      onCategorySelect(activeCategoryId);
    }

    const fetchTrendOnly = async () => {
      setIsLoadingTrend(true);
      setError(null);
      try {
        const year = getYear(currentDate);
        const month = getMonth(currentDate) + 1;
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

        // SỬA LỖI: Xây dựng lại params cho ĐÚNG với API của trend
        let trendParams = {};
        if (period === "week") {
          trendParams = {
            period: "day",
            startDate: weekStart.toISOString().split("T")[0],
            days: 7,
          };
        } else if (period === "month") {
          trendParams = { period: "day", year, month };
        } else if (period === "year") {
          trendParams = { period: "month", year };
        }

        // Nếu có categoryId được chọn, thêm vào params
        // Nếu không (bỏ chọn), fetch lại trend chung cho khoảng thời gian đó
        if (activeCategoryId) {
          trendParams.categoryId = activeCategoryId;
        }

        const res = await statisticsService.getTrendData(trendParams);
        setTrendData(res || []);
      } catch (err) {
        setError("Lỗi cập nhật biểu đồ xu hướng.");
        console.error(err);
      } finally {
        setIsLoadingTrend(false);
      }
    };

    fetchTrendOnly();
  }, [activeCategoryId, currentDate, period, onCategorySelect]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setCurrentDate(new Date());
    setActiveCategoryId(null);
    setActiveCategoryName(null);
  };

  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
    setActiveCategoryId(null);
    setActiveCategoryName(null);
  };

  const handleCategorySelect = (data) => {
    if (data && data.id === activeCategoryId) {
      setActiveCategoryId(null);
      setActiveCategoryName(null);
    } else if (data) {
      setActiveCategoryId(data.id);
      setActiveCategoryName(data.name);
    }
  };

  const getDynamicTitle = () => {
    switch (period) {
      case "week":
        return "Phân Tích Chi Tiêu Tuần Này";
      case "month":
        return `Phân Tích Chi Tiêu ${currentDate.toLocaleDateString("vi-VN", {
          month: "long",
          year: "numeric",
        })}`;
      case "year":
        return `Phân Tích Chi Tiêu Năm ${currentDate.getFullYear()}`;
      default:
        return "Phân Tích Chi Tiêu";
    }
  };

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.header}>
        <h2 className={styles.analyticsTitle}>{getDynamicTitle()}</h2>
      </div>

      <div className={styles.sectionHeader}>
        <DateRangeNavigator
          period={period}
          currentDate={currentDate}
          onPeriodChange={handlePeriodChange}
          onDateChange={handleDateChange}
        />
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.trendChartContainer}>
          <IncomeExpenseTrendChart
            data={trendData}
            period={period}
            loading={isLoadingTrend}
            error={error}
            categoryName={activeCategoryName}
            categoryId={activeCategoryId}
          />
        </div>
        <div className={styles.categoryChartContainer}>
          <CategoryExpenseChart
            data={categoryData}
            total={totalExpense}
            loading={isLoadingCategories}
            error={error}
            onSliceClick={handleCategorySelect}
            activeCategoryId={activeCategoryId}
          />
        </div>
      </div>

      <div className={styles.footerLinkContainer}>
        <Link to="/categories" className={styles.detailsLink}>
          Xem chi tiết →
        </Link>
      </div>
    </div>
  );
};

export default DetailedAnalyticsSection;
