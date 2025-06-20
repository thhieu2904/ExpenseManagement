// src/components/Goals/GoalCard.jsx

import React, { useState, useEffect, useRef } from "react"; // Thêm useState, useEffect, useRef
import styles from "./GoalCard.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisV,
  faPen,
  faTrash,
  faPlusCircle,
} from "@fortawesome/free-solid-svg-icons";
import { formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { FaTrophy, FaExclamationCircle } from "react-icons/fa";

// ... các hàm formatCurrency và formatDeadline giữ nguyên ...
const formatCurrency = (amount) => {
  if (typeof amount !== "number") return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};
const formatDeadline = (deadline) => {
  if (!deadline) return "Không có hạn chót";
  const deadlineDate = parseISO(deadline);
  if (new Date() > deadlineDate) {
    return <span className={styles.deadlineOverdue}>Đã quá hạn</span>;
  }
  return `Còn ${formatDistanceToNow(deadlineDate, {
    addSuffix: false,
    locale: vi,
  })}`;
};

export default function GoalCard({ goal, onEdit, onDelete, onAddFunds }) {
  // ✅ THÊM STATE ĐỂ QUẢN LÝ MENU
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null); // Dùng để xác định click bên ngoài menu

  // Tính toán tiến độ (giữ nguyên)
  const progress =
    goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const progressPercentage = Math.min(progress, 100).toFixed(0);
  const isCompleted = goal.currentAmount >= goal.targetAmount;
  const isOverdue =
    goal.deadline && new Date(goal.deadline) < new Date() && !isCompleted;

  // ✅ THÊM LOGIC ĐỂ ĐÓNG MENU KHI CLICK RA NGOÀI
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    // Lắng nghe sự kiện click trên toàn bộ document
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Dọn dẹp listener khi component unmount
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <div
      className={`${styles.card} ${isCompleted ? styles.completed : ""} ${
        isOverdue ? styles.overdue : ""
      }`}
    >
      {isCompleted && (
        <div className={styles.completedBanner}>
          <FaTrophy className={styles.trophyIcon} />
          <span>Đã hoàn thành!</span>
        </div>
      )}
      {isOverdue && (
        <div className={styles.overdueBanner}>
          <FaExclamationCircle className={styles.overdueIcon} />
          <span>Đã quá hạn</span>
        </div>
      )}
      <div className={styles.cardHeader}>
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>{goal.icon || "🎯"}</span>
        </div>
        <h3 className={styles.goalName}>{goal.name}</h3>

        {/* ✅ THÊM MENU ACTIONS VÀO ĐÂY */}
        <div className={styles.actionsMenu} ref={menuRef}>
          <button
            className={styles.menuButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <FontAwesomeIcon icon={faEllipsisV} />
          </button>

          {isMenuOpen && (
            <div className={styles.dropdownMenu}>
              <button
                onClick={() => {
                  onEdit(goal);
                  setIsMenuOpen(false);
                }}
              >
                <FontAwesomeIcon icon={faPen} /> Sửa
              </button>
              <button
                onClick={() => {
                  onDelete(goal._id);
                  setIsMenuOpen(false);
                }}
                className={styles.deleteButton}
              >
                <FontAwesomeIcon icon={faTrash} /> Xóa
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.cardBody}>
        {/* ... Phần body của card giữ nguyên ... */}
        <div className={styles.progressInfo}>
          <span>Tiến độ</span>
          <span className={styles.progressPercentage}>
            {progressPercentage}%
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className={styles.amountInfo}>
          <span className={styles.currentAmount}>
            {formatCurrency(goal.currentAmount)}
          </span>
          <span className={styles.targetAmount}>
            / {formatCurrency(goal.targetAmount)}
          </span>
        </div>
      </div>

      <div className={styles.cardFooter}>
        {/* ... Phần footer của card giữ nguyên ... */}
        <div className={styles.deadlineInfo}>
          {formatDeadline(goal.deadline)}
        </div>
        {!isCompleted && (
          <button
            className={styles.addFundsButton}
            onClick={() => onAddFunds(goal)}
          >
            <FontAwesomeIcon icon={faPlusCircle} /> Nạp tiền
          </button>
        )}
      </div>
      {isCompleted && (
        <div className={styles.congratsText}>
          🎉 Chúc mừng bạn đã đạt mục tiêu! 🎉
        </div>
      )}
    </div>
  );
}
