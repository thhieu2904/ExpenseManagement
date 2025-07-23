import axiosInstance from "./axiosConfig";

export const getProfile = () => axiosInstance.get("/users/profile");
export const updateProfile = (fullname, email) => {
  return axiosInstance.put("/users/profile", { fullname, email });
};
export const updateAvatar = (formData) =>
  axiosInstance.put("/users/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const changePassword = (oldPassword, newPassword) =>
  axiosInstance.put("/users/change-password", { oldPassword, newPassword });
export const getLoginHistory = () => axiosInstance.get("/users/login-history");
export const deleteAccount = () => axiosInstance.delete("/users/me");

// ✅ THÊM: Export/Import functions
export const exportUserData = async () => {
  const response = await axiosInstance.get("/users/export");
  return response; // ✅ SỬA: Return full response để có thể access response.data.data
};

export const importUserData = async (data, clearExisting = true) => {
  const response = await axiosInstance.post("/users/import", {
    data,
    clearExisting,
  });
  return response.data;
};

// Get avatar URL through API service instead of direct localhost access
export const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return "/default-avatar.png";

  // If it's already a full URL, return as is
  if (avatarPath.startsWith("http")) return avatarPath;

  // Use the base URL from axiosInstance to ensure consistency
  const baseURL = axiosInstance.defaults.baseURL.replace("/api", ""); // Remove /api suffix for static files
  return `${baseURL}${avatarPath}`;
};

// Clear all user data (for data import/export features)
export const clearUserData = async () => {
  const response = await axiosInstance.delete("/users/clear-data");
  return response.data;
};
