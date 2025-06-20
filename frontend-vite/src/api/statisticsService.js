// TẠO FILE MỚI: frontend-vite/src/api/statisticsService.js

// ✅ Import axiosInstance từ file cấu hình cùng cấp
import axiosInstance from "./axiosConfig.js";

// Hàm lấy dữ liệu thẻ tổng quan
const getSummaryStats = (params) => {
  return axiosInstance.get("/statistics/summary", { params });
};

// Hàm lấy dữ liệu cho biểu đồ xu hướng
const getTrendData = (params) => {
  return axiosInstance.get("/statistics/trend", { params });
};

// Hàm lấy dữ liệu cho biểu đồ cơ cấu
const getCategoryData = (params) => {
  return axiosInstance.get("/statistics/by-category", { params });
};

// Hàm lấy danh sách giao dịch trong kỳ
const getTransactionsInPeriod = (params) => {
  return axiosInstance.get("/transactions", { params });
};

// Thêm hàm xóa giao dịch
const deleteTransaction = (id) => {
  return axiosInstance.delete(`/transactions/${id}`);
};

const statisticsService = {
  getSummaryStats,
  getTrendData,
  getCategoryData,
  getTransactionsInPeriod,
  deleteTransaction,
};

export default statisticsService;
