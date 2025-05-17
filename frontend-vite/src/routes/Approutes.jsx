import React from "react";
import { Routes, Route } from "react-router-dom";
import Welcome from "../pages/welcome";
import Login from "../pages/Login";
import HomePage from "../pages/HomePage";
import Register from "../pages/Register";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/HomePage" element={<HomePage />} />
    </Routes>
  );
}
