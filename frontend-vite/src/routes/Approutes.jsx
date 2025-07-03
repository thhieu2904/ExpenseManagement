import React from "react";
import { Routes, Route } from "react-router-dom";
import Welcome from "../pages/Welcome";
import Register from "../pages/Register";
import Login from "../pages/Login";
import HomePage from "../pages/HomePage";
import CategoriesPage from "../pages/CategoriesPage";
import AccountPage from "../pages/AccountPage";
import TransactionsPage from "../pages/TransactionsPage";
import GoalsPage from "../pages/GoalsPage";
import StatisticsPage from "../pages/StatisticsPage";
import ProfilePage from "../pages/ProfilePage";
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/homepage" element={<HomePage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/accounts" element={<AccountPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/goals" element={<GoalsPage />} />
      <Route path="/statistics" element={<StatisticsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}
