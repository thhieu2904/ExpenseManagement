// src/components/RecentTransactions/TransactionItem.jsx
import React, { forwardRef } from "react";
// BỎ import axios và useNavigate
import styles from "./RecentTransactions.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { getIconObject } from "../../utils/iconMap";

// ... các hàm formatDate và formatCurrency giữ nguyên ...
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
const formatCurrency = (amount) => {
  if (typeof amount !== "number") return "0 ₫";
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

// ✅ Component giờ nhận vào onEditRequest và onDeleteRequest
const TransactionItem = forwardRef(
  ({ transaction, onEditRequest, onDeleteRequest }, ref) => {
    if (!transaction) return null;

    const { id, date, category, description, paymentMethod, amount, type } =
      transaction;

    // ✅ Hàm handleEdit và handleDelete giờ chỉ gọi prop từ cha, không chứa logic
    const handleEdit = () => onEditRequest(transaction);
    const handleDelete = () => onDeleteRequest(id);

    // ... hàm getStyleForAccount giữ nguyên ...
    const getStyleForAccount = (account) => {
      if (!account?.type) return styles.pmOther;
      switch (account.type) {
        case "TIENMAT":
          return styles.pmCash;
        case "THENGANHANG":
          return styles.pmBank;
        default:
          return styles.pmOther;
      }
    };

    return (
      <tr ref={ref} className={styles.transactionRow}>
        <td data-label="Thời gian">{formatDate(date)}</td>
        <td data-label="Danh mục" className={styles.categoryCell}>
          <FontAwesomeIcon
            icon={getIconObject(category?.icon)}
            className={styles.categoryIcon}
            style={{ marginRight: "8px" }}
          />
          {category?.name || "N/A"}
        </td>
        <td data-label="Mô tả" className={styles.descriptionCell}>
          {description || "-"}
        </td>
        <td data-label="Phương thức TT">
          <span
            className={`${styles.paymentMethodBadge} ${getStyleForAccount(
              paymentMethod
            )}`}
          >
            {paymentMethod?.name || "N/A"}
          </span>
        </td>
        <td
          data-label="Số tiền"
          className={`${styles.amountCell} ${
            type === "THUNHAP" ? styles.incomeAmount : styles.expenseAmount
          }`}
        >
          {formatCurrency(amount)}
        </td>
        <td data-label="Hành động" className={styles.actionsCell}>
          {/* ✅ Các nút bây giờ gọi hàm mới */}
          <button
            onClick={handleEdit}
            className={`${styles.actionButton} ${styles.editButton}`}
            title="Sửa"
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button
            onClick={handleDelete}
            className={`${styles.actionButton} ${styles.deleteButton}`}
            title="Xóa"
          >
            <FontAwesomeIcon icon={faTrashAlt} />
          </button>
        </td>
      </tr>
    );
  }
);

export default TransactionItem;
