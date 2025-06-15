// src/components/RecentTransactions/RecentTransactions.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import TransactionItem from "./TransactionItem";
import styles from "./RecentTransactions.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import AddEditTransactionModal from "../Transactions/AddEditTransactionModal";
import ConfirmDialog from "../Common/ConfirmDialog";

const ITEMS_PER_PAGE = 5;

const RecentTransactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const initialLoadAttempted = useRef(false);

  // State cho việc sửa/xóa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // ✅ Hàm gọi API chính, xử lý cả tải lần đầu và tải thêm
  const fetchTransactions = useCallback(
    async (pageToFetch, shouldRefresh = false) => {
      setIsLoading(true);
      if (pageToFetch === 1) setError("");

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Bạn chưa đăng nhập.");
          setIsLoading(false);
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/api/transactions?page=${pageToFetch}&limit=${ITEMS_PER_PAGE}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const {
          data,
          totalPages: apiTotalPages,
          currentPage: apiCurrentPage,
        } = response.data;

        if (data && Array.isArray(data)) {
          // Nếu refresh, thay thế toàn bộ. Nếu không, nối vào danh sách cũ.
          setTransactions((prev) =>
            shouldRefresh ? data : [...prev, ...data]
          );
          setTotalPages(apiTotalPages);
          setCurrentPage(apiCurrentPage);
          setHasMore(apiCurrentPage < apiTotalPages);
        }
      } catch (err) {
        setError("Không thể tải danh sách giao dịch.");
        console.error("Lỗi fetchTransactions:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Tải dữ liệu lần đầu
  useEffect(() => {
    if (!initialLoadAttempted.current) {
      initialLoadAttempted.current = true;
      fetchTransactions(1, true); // Tải trang 1 và yêu cầu refresh
    }
  }, [fetchTransactions]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchTransactions(currentPage + 1, false); // Tải trang tiếp theo, không refresh
    }
  };

  // === Các hàm xử lý cho Sửa/Xóa ===
  const handleEditRequest = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (transactionId) => {
    setTransactionToDelete(transactionId);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/transactions/${transactionToDelete}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setIsConfirmOpen(false);
      setTransactionToDelete(null);
      // Tải lại toàn bộ danh sách từ đầu để đảm bảo nhất quán
      window.location.reload();
    } catch (err) {
      alert("Xóa giao dịch thất bại!");
      setIsConfirmOpen(false);
    }
  };

  const handleSubmitSuccess = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    // Tải lại toàn bộ trang để cập nhật cả StatsOverview và RecentTransactions
    window.location.reload();
  };

  const handleViewDetails = () => {
    navigate("/transactions");
  };

  // ... Phần JSX để hiển thị ...
  let content;
  if (isLoading && transactions.length === 0) {
    content = <div className={styles.loadingIndicator}>...</div>;
  } else if (error) {
    content = (
      <p className={`${styles.errorText} ${styles.noTransactions}`}>{error}</p>
    );
  } else if (transactions.length === 0) {
    content = <p className={styles.noTransactions}>Chưa có giao dịch nào.</p>;
  } else {
    content = (
      <div className={styles.tableWrapper}>
        <table className={styles.transactionsTable}>
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Danh mục</th>
              <th>Mô tả</th>
              <th>Phương thức TT</th>
              <th className={styles.amountHeader}>Số tiền</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                // ✅ Truyền đúng props xuống
                onEditRequest={handleEditRequest}
                onDeleteRequest={handleDeleteRequest}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={styles.recentTransactionsContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>Giao dịch gần đây</h3>
        <button
          onClick={handleViewDetails}
          className={styles.viewDetailsButton}
        >
          Xem chi tiết
        </button>
      </div>
      {content}
      <div className={styles.loadMoreButtonOuterContainer}>
        {hasMore && !isLoading && (
          <button onClick={handleLoadMore} className={styles.loadMoreButton}>
            <span>Tải thêm</span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={styles.loadMoreIcon}
            />
          </button>
        )}
        {isLoading && transactions.length > 0 && (
          <button className={styles.loadMoreButton} disabled>
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className={styles.loadMoreIcon}
            />
            <span>Đang tải...</span>
          </button>
        )}
      </div>
      {!hasMore && transactions.length > 0 && (
        <p className={styles.noMoreTransactions}>
          Đã hiển thị tất cả giao dịch.
        </p>
      )}

      {/* ✅ Render các modal cần thiết */}
      {isModalOpen && (
        <AddEditTransactionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmitSuccess={handleSubmitSuccess}
          mode={editingTransaction ? "edit" : "add"}
          initialData={editingTransaction}
        />
      )}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa giao dịch này không?"
      />
    </div>
  );
};

export default RecentTransactions;
