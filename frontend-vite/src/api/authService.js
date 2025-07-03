import axiosInstance from "./axiosConfig";

export const login = ({ username, password }) =>
  axiosInstance.post("/auth/login", { username, password });

export const register = ({ username, fullname, password }) =>
  axiosInstance.post("/auth/register", { username, fullname, password }); 