import axiosInstance from "./axiosConfig";

export const getProfile = () => axiosInstance.get("/users/profile");
export const updateProfile = (fullname) => axiosInstance.put("/users/profile", { fullname });
export const updateAvatar = (formData) => axiosInstance.put("/users/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const changePassword = (oldPassword, newPassword) => axiosInstance.put("/users/change-password", { oldPassword, newPassword });
export const getLoginHistory = () => axiosInstance.get("/users/login-history");
export const deleteAccount = () => axiosInstance.delete("/users/me"); 