// src/pages/GoalsPage.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import GoalsList from "../components/Goals/GoalsList";
import AddEditGoalModal from "../components/Goals/AddEditGoalModal";
import styles from "../styles/GoalsPage.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import AddFundsModal from "../components/Goals/AddFundsModal";

// ✅ 1. IMPORT COMPONENT CONFIRMDIALOG CỦA BẠN
import ConfirmDialog from "../components/Common/ConfirmDialog";

export default function GoalsPage() {
  // Các state cũ giữ nguyên
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState("add");
  const [currentGoal, setCurrentGoal] = useState(null);
  const [userData, setUserData] = useState({ name: "", avatarUrl: null });

  // ✅ 2. THÊM STATE MỚI CHO HỘP THOẠI XÁC NHẬN
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null); // Lưu id của goal sắp xóa

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  // Hàm fetchGoals giữ nguyên
  const fetchGoals = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Bạn cần đăng nhập để xem mục tiêu.");
      setIsLoading(false);
      return;
    }
    try {
      const response = await axios.get("http://localhost:5000/api/goals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGoals(response.data);
    } catch (err) {
      setError("Không thể tải danh sách mục tiêu. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const account = JSON.parse(storedUser);
        setUserData({
          name:
            account.username ||
            account.fullName ||
            account.name ||
            "Người dùng",
          avatarUrl: account.avatarUrl || account.profilePicture || null,
        });
      } catch (error) {
        console.error(
          "Lỗi khi parse thông tin người dùng từ localStorage:",
          error
        );
      }
    }
  }, []);

  const handleOpenAddFundsModal = (goal) => {
    setCurrentGoal(goal); // Lưu lại mục tiêu đang được thao tác
    setIsAddFundsModalOpen(true);
  };

  const handleActionSuccess = () => {
    fetchGoals();
    setIsModalOpen(false); // Đóng modal thêm/sửa
    setIsAddFundsModalOpen(false); // Đóng modal nạp tiền
  };

  const handleOpenAddModal = () => {
    setEditMode("add");
    setCurrentGoal(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal) => {
    setEditMode("edit");
    setCurrentGoal(goal);
    setIsModalOpen(true);
  };

  const handleRequestDelete = (goalId) => {
    setGoalToDelete(goalId);
    setDeleteError(null); // Xóa lỗi cũ trước khi mở dialog
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!goalToDelete) return;

    setIsDeleting(true); // Bắt đầu xử lý
    setDeleteError(null); // Xóa lỗi cũ

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:5000/api/goals/${goalToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchGoals();
      setIsConfirmOpen(false); // Đóng dialog nếu thành công
    } catch (err) {
      console.error("Lỗi khi xóa mục tiêu:", err);
      // Gán lỗi để hiển thị trong dialog
      setDeleteError(
        err.response?.data?.message || "Lỗi không xác định, vui lòng thử lại."
      );
    } finally {
      setIsDeleting(false); // Kết thúc xử lý
    }
  };

  const handleCloseConfirmDialog = () => {
    setIsConfirmOpen(false);
    setGoalToDelete(null);
    setDeleteError(null);
  };

  return (
    <div>
      <Header userName={userData.name} userAvatar={userData.avatarUrl} />
      <Navbar />
      <main className={styles.pageWrapper}>
        {" "}
        {/* Dùng main để bọc nội dung chính */}
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>Mục tiêu của tôi</h1>
          <button onClick={handleOpenAddModal} className={styles.addButton}>
            <FontAwesomeIcon icon={faPlus} className={styles.addIcon} />
            Tạo mục tiêu mới
          </button>
        </div>
        <div className={styles.content}>
          {isLoading && (
            <div className={styles.loading}>Đang tải dữ liệu...</div>
          )}
          {error && <div className={styles.error}>{error}</div>}

          {!isLoading && !error && (
            <GoalsList
              goals={goals}
              onEdit={handleOpenEditModal}
              onDelete={handleRequestDelete}
              onAddFunds={handleOpenAddFundsModal}
            />
          )}
        </div>
      </main>

      {/* Các modal vẫn nằm ngoài main để có thể overlay toàn bộ trang */}
      {isModalOpen && (
        <AddEditGoalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmitSuccess={handleActionSuccess}
          mode={editMode}
          initialData={currentGoal}
        />
      )}

      {isConfirmOpen && (
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={handleCloseConfirmDialog}
          onConfirm={handleConfirmDelete}
          title="Xác nhận Xóa Mục tiêu"
          message="Bạn có chắc chắn muốn xóa mục tiêu này? Hành động này không thể hoàn tác."
          isProcessing={isDeleting}
          errorMessage={deleteError}
          confirmText="Xóa"
        />
      )}

      {isAddFundsModalOpen && (
        <AddFundsModal
          isOpen={isAddFundsModalOpen}
          onClose={() => setIsAddFundsModalOpen(false)}
          onSubmitSuccess={handleActionSuccess}
          goalData={currentGoal}
        />
      )}

      <Footer />
    </div>
  );
}
