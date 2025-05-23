import React from "react";
import { Routes, Route } from "react-router-dom";
import Welcome from "../pages/Welcome";
import Register from "../pages/Register";
import Login from "../pages/Login";
import HomePage from "../pages/HomePage";
import CategoriesPage from "../pages/CategoriesPage";
import AccountPage from "../pages/AccountPage";
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/HomePage" element={<HomePage />} />
      <Route path="/CategoriesPage" element={<CategoriesPage />} />

      <Route path="/AccountPage" element={<AccountPage />} />
    </Routes>
  );
}
