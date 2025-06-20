import axiosInstance from "./axiosConfig";

// Lấy dữ liệu tổng quan cho StatsOverview
export const getStatsOverview = (token) => {
  return axiosInstance.get("/statistics/overview", {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Lấy dữ liệu cho CategoryExpenseChart
export const getCategoryChartData = (token, params = {}) => {
  return axiosInstance.get("/statistics/by-category", {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
};
