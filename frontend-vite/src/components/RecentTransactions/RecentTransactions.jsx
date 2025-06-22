// src/components/RecentTransactions/RecentTransactions.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import TransactionItem from "./TransactionItem";
import styles from "./RecentTransactions.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import AddEditTransactionModal from "../Transactions/AddEditTransactionModal";
import ConfirmDialog from "../Common/ConfirmDialog";

const RecentTransactions = ({
  // Props từ cha
  transactions = [],
  isLoading = false,
  error = "",
  hasMore = false,

  // Callbacks từ cha
  onLoadMore,
  onEditRequest,
  onDeleteRequest,
  onConfirmDelete,
  onSubmitSuccess,
  onCloseModal,
  onCloseConfirm,

  // State cho modals
  isModalOpen = false,
  isConfirmOpen = false,
  editingTransaction = null,
}) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate("/transactions");
  };

  // Render content dựa trên state
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
                onEditRequest={onEditRequest}
                onDeleteRequest={onDeleteRequest}
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
          <button onClick={onLoadMore} className={styles.loadMoreButton}>
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

      {/* Modals */}
      {isModalOpen && (
        <AddEditTransactionModal
          isOpen={isModalOpen}
          onClose={onCloseModal}
          onSubmitSuccess={onSubmitSuccess}
          mode={editingTransaction ? "edit" : "add"}
          initialData={editingTransaction}
        />
      )}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={onCloseConfirm}
        onConfirm={onConfirmDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa giao dịch này không?"
      />
    </div>
  );
};

export default RecentTransactions;
