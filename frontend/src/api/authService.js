import axiosInstance from "./axiosConfig";

export const login = ({ username, password }) =>
  axiosInstance.post("/auth/login", { username, password });

export const register = (userData) =>
  axiosInstance.post("/auth/register", userData);
