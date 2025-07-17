// src/api/goalService.js

import axiosInstance from "./axiosConfig"; // Sử dụng instance đã cấu hình

// Hàm lấy tất cả mục tiêu
export const getGoals = () => {
  return axiosInstance.get("/goals");
};

// Hàm xóa một mục tiêu theo ID
export const deleteGoal = (goalId) => {
  return axiosInstance.delete(`/goals/${goalId}`);
};

// Hàm tạo mục tiêu mới
export const createGoal = (goalData) => {
  return axiosInstance.post("/goals", goalData);
};

// Hàm cập nhật mục tiêu
export const updateGoal = (goalId, goalData) => {
  return axiosInstance.put(`/goals/${goalId}`, goalData);
};

// Hàm nạp tiền vào mục tiêu
export const addFundsToGoal = (goalId, fundsData) => {
  return axiosInstance.post(`/goals/${goalId}/add-funds`, fundsData);
};

// ✅ HÀM MỚI: Lấy danh sách tài khoản
export const getAccounts = () => {
  return axiosInstance.get("/accounts");
};
