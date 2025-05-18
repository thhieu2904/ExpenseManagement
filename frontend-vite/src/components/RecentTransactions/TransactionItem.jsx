// src/components/RecentTransactions/TransactionItem.jsx
import React, { forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./RecentTransactions.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUtensils,
  faShoppingBag,
  faMoneyBillWave,
  faEdit,
  faTrashAlt,
  faEllipsisH,
  faQuestionCircle,
} from "@fortawesome/free-solid-svg-icons"; // Thêm các icon cần thiết

// Hàm định dạng ngày giờ
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

// Hàm định dạng tiền tệ
const formatCurrency = (amount) => {
  if (typeof amount !== "number") return "0 ₫";
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

// Map category name/id to FontAwesome icon
// Bạn cần mở rộng map này dựa trên các danh mục thực tế của bạn
const categoryIconMap = {
  "Ăn uống": faUtensils,
  "Mua sắm": faShoppingBag,
  Lương: faMoneyBillWave,
  "Di chuyển": "car", // ví dụ
  "Giải trí": "film", // ví dụ
  // ... thêm các danh mục khác
};

const getCategoryIcon = (categoryName) => {
  return categoryIconMap[categoryName] || faQuestionCircle; // Icon mặc định nếu không tìm thấy
};

// Component TransactionItem sử dụng forwardRef để nhận ref từ cha
const TransactionItem = forwardRef(({ transaction, onDeleteSuccess }, ref) => {
  const navigate = useNavigate();

  if (!transaction) {
    return null; // Hoặc hiển thị một placeholder
  }

  const { id, date, category, description, paymentMethod, amount, type } =
    transaction;

  const handleEdit = () => {
    // Điều hướng đến trang sửa giao dịch, truyền id
    navigate(`/transactions/edit/${id}`);
    console.log("Edit transaction:", id);
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa giao dịch "${description || "này"}" không?`
      )
    ) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:5000/api/transactions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Xóa giao dịch thành công!");
        if (onDeleteSuccess) {
          onDeleteSuccess(id); // Gọi callback để cập nhật UI ở component cha
        }
      } catch (err) {
        console.error("Lỗi khi xóa giao dịch:", err);
        alert("Xóa giao dịch thất bại. Vui lòng thử lại.");
      }
    }
  };

  const paymentMethodStyle = (pmType) => {
    switch (pmType?.toLowerCase()) {
      case "bank":
      case "bidv":
      case "vietcombank": // Thêm các tên ngân hàng cụ thể
        return styles.pmBank;
      case "cash":
      case "tiền mặt":
        return styles.pmCash;
      case "ewallet":
      case "momo": // Ví dụ
        return styles.pmEwallet;
      default:
        return styles.pmOther;
    }
  };

  return (
    <tr ref={ref} className={styles.transactionRow}>
      <td data-label="Thời gian">{formatDate(date)}</td>
      <td data-label="Danh mục" className={styles.categoryCell}>
        <FontAwesomeIcon
          icon={getCategoryIcon(category?.name)}
          className={styles.categoryIcon}
        />
        {category?.name || "N/A"}
      </td>
      <td data-label="Mô tả" className={styles.descriptionCell}>
        {description || "-"}
      </td>
      <td data-label="Phương thức TT">
        <span
          className={`${styles.paymentMethodBadge} ${paymentMethodStyle(
            paymentMethod?.type || paymentMethod?.name
          )}`}
        >
          {paymentMethod?.name || "N/A"}
        </span>
      </td>
      <td
        data-label="Số tiền"
        className={`${styles.amountCell} ${
          type === "income" || amount > 0 ? styles.income : styles.expense
        }`}
      >
        {formatCurrency(amount)}
      </td>
      <td data-label="Hành động" className={styles.actionsCell}>
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
});

export default TransactionItem;
