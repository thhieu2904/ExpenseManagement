import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGoals, deleteGoal } from "../api/goalService";
import GoalsList from "../components/Goals/GoalsList";
import AddEditGoalModal from "../components/Goals/AddEditGoalModal";
import ExtendedHeaderCard from "../components/Common/ExtendedHeaderCard";
import HeaderCard from "../components/Common/HeaderCard";
import styles from "../styles/GoalsPage.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import AddFundsModal from "../components/Goals/AddFundsModal";
import ConfirmDialog from "../components/Common/ConfirmDialog";

export default function GoalsPage() {
  // ✅ 2. KHỞI TẠO QUERY CLIENT ĐỂ TƯƠNG TÁC VỚI REACT QUERY
  const queryClient = useQueryClient();

  // === CÁC STATE CŨ VẪN CẦN CHO VIỆC ĐIỀU KHIỂN UI (MODAL, FORM) ===
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [editMode, setEditMode] = useState("add");
  const [userData, setUserData] = useState({ name: "", avatarUrl: null });
  // =============================================================

  // ✅ 3. THAY THẾ TOÀN BỘ LOGIC FETCH CŨ BẰNG `useQuery`
  // `useQuery` sẽ tự động quản lý `isLoading`, `error`, và `data` cho bạn.
  const {
    data: goals = [], // Dùng `data` thay cho state `goals`, đặt giá trị mặc định là []
    isLoading, // Thay cho state `isLoading`
    error, // Thay cho state `error`
  } = useQuery({
    queryKey: ["goals"], // Đây là "tên định danh" cho dữ liệu này. Rất quan trọng!
    queryFn: getGoals, // Hàm để fetch dữ liệu. React Query sẽ tự gọi nó.
    select: (response) => response.data, // Chỉ lấy phần data từ response của axios, giúp component gọn hơn.
  });

  // ✅ 4. THAY THẾ LOGIC XÓA BẰNG `useMutation`
  // `useMutation` dùng cho các hành động thay đổi dữ liệu (POST, PUT, DELETE).
  const deleteMutation = useMutation({
    mutationFn: deleteGoal, // Hàm thực hiện hành động xóa.
    onSuccess: () => {
      // KHI XÓA THÀNH CÔNG:
      // Báo cho React Query biết dữ liệu với key "goals" đã cũ và cần được tải lại.
      // React Query sẽ tự động gọi lại `useQuery` ở trên. KHÔNG CẦN GỌI `fetchGoals()` THỦ CÔNG!
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      handleCloseConfirmDialog(); // Đóng dialog xác nhận
    },
  });

  // ✅ 5. BỎ HOÀN TOÀN HÀM `fetchGoals` và `useEffect` GỌI NÓ. CHÚNG KHÔNG CÒN CẦN THIẾT.

  // useEffect để lấy thông tin user vẫn giữ nguyên vì nó là client state, không phải server state
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const account = JSON.parse(storedUser);
        setUserData({
          name: account.name || "Người dùng",
          avatarUrl: account.avatarUrl || null,
        });
      } catch (error) {
        console.error(
          "Lỗi khi parse thông tin người dùng từ localStorage:",
          error
        );
      }
    }
  }, []);

  // ✅ 6. HÀM NÀY GIỜ CHỈ CẦN LÀM MỚI DỮ LIỆU VÀ ĐÓNG MODAL
  const handleActionSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    setIsModalOpen(false);
    setIsAddFundsModalOpen(false);
  };

  // ✅ 7. HÀM XÁC NHẬN XÓA GIỜ SIÊU ĐƠN GIẢN
  const handleConfirmDelete = () => {
    if (!goalToDelete) return;
    deleteMutation.mutate(goalToDelete); // Chỉ cần gọi hàm mutate!
  };

  // Các hàm mở/đóng modal khác không thay đổi
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
  const handleOpenAddFundsModal = (goal) => {
    setCurrentGoal(goal);
    setIsAddFundsModalOpen(true);
  };
  const handleRequestDelete = (goalId) => {
    setGoalToDelete(goalId);
    setIsConfirmOpen(true);
  };
  const handleCloseConfirmDialog = () => {
    setIsConfirmOpen(false);
    setGoalToDelete(null);
  };

  return (
    <div>
      <Header userName={userData.name} userAvatar={userData.avatarUrl} />
      <Navbar />
      <main className={styles.pageWrapper}>
        <HeaderCard
          title="Mục tiêu của tôi"
          action={
            <button onClick={handleOpenAddModal} className={styles.addButton}>
              <FontAwesomeIcon icon={faPlus} className={styles.addIcon} />
              Tạo mục tiêu mới
            </button>
          }
        />
        <div className={styles.content}>
          {isLoading && (
            <div className={styles.loading}>Đang tải dữ liệu...</div>
          )}
          {error && (
            <div className={styles.error}>
              {"Đã có lỗi xảy ra: " + error.message}
            </div>
          )}

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

      {/* Các Modal vẫn giữ nguyên, nhưng giờ chúng sẽ gọi `handleActionSuccess` để tự động cập nhật list */}
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
          onClose={() =>
            deleteMutation.isPending ? null : handleCloseConfirmDialog()
          }
          onConfirm={handleConfirmDelete}
          title="Xác nhận Xóa Mục tiêu"
          message="Bạn có chắc chắn muốn xóa mục tiêu này? Hành động này không thể hoàn tác."
          // ✅ 9. SỬ DỤNG TRẠNG THÁI LOADING VÀ ERROR TỪ `useMutation`
          isProcessing={deleteMutation.isPending}
          errorMessage={deleteMutation.error?.response?.data?.message}
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
