// src/components/Goals/GoalCard.jsx (Đã sửa lỗi)

import React, { useState, useEffect, useRef } from "react";
import styles from "./GoalCard.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisV,
  faPen,
  faTrash,
  faPlusCircle,
  faHistory,
  faArchive,
  faThumbtack,
  faBoxOpen,
} from "@fortawesome/free-solid-svg-icons";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { FaTrophy, FaExclamationCircle } from "react-icons/fa";

// Helper Functions
const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN").format(amount || 0) + " ₫";

const formatDeadlineText = (deadline, isCompleted) => {
  if (!deadline) return "Không có hạn chót";
  const deadlineDate = parseISO(deadline);

  if (isCompleted) {
    return `Hoàn thành ngày ${format(new Date(), "dd/MM/yyyy")}`;
  }

  if (new Date() > deadlineDate) {
    return `Hạn chót: ${format(deadlineDate, "dd/MM/yyyy")}`;
  }

  return `Còn ${formatDistanceToNow(deadlineDate, {
    addSuffix: false,
    locale: vi,
  })}`;
};

export default function GoalCard({
  goal,
  onEdit,
  onDelete,
  onAddFunds,
  onShowHistory,
  onToggleArchive,
  onTogglePin,
  // ❌ ĐÃ XÓA: hiddenWhenArchived
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isCompleted = goal.currentAmount >= goal.targetAmount;
  const isOverdue =
    !isCompleted && goal.deadline && new Date(goal.deadline) < new Date();
  const isArchived = goal.archived;
  const isPinned = goal.isPinned; // Đã có sẵn
  const progress =
    goal.targetAmount > 0
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      : 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  // ❌ ĐÃ XÓA: Logic if (hiddenWhenArchived) vì đã được xử lý ở component cha

  const cardClasses = [
    styles.card,
    isCompleted ? styles.completed : "",
    isOverdue ? styles.overdue : "",
    isArchived ? styles.archived : "",
    isPinned ? styles.pinned : "", // ✅ Thêm class cho trạng thái ghim
  ].join(" ");

  return (
    <div className={cardClasses}>
      {/* ✅ HIỂN THỊ GHIM: JSX này đã đúng, sẽ hoạt động khi isPinned=true */}
      {isPinned && (
        <div className={styles.pinnedIconWrapper}>
          <FontAwesomeIcon icon={faThumbtack} className={styles.pinnedIcon} />
        </div>
      )}

      {/* Banner cho các trạng thái khác */}
      {isArchived && (
        <div className={`${styles.banner} ${styles.archivedBanner}`}>
          <FontAwesomeIcon icon={faBoxOpen} className={styles.bannerIcon} />
          <span>Đã lưu trữ</span>
        </div>
      )}
      {isCompleted && !isArchived && (
        <div className={styles.banner}>
          <FaTrophy className={styles.bannerIcon} />
          <span>Đã hoàn thành!</span>
        </div>
      )}
      {isOverdue && !isArchived && (
        <div className={`${styles.banner} ${styles.overdueBanner}`}>
          <FaExclamationCircle className={styles.bannerIcon} />
          <span>Đã quá hạn</span>
        </div>
      )}

      <div className={styles.cardHeader}>
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>{goal.icon || "🎯"}</span>
        </div>
        <h3 className={styles.goalName}>{goal.name}</h3>
        <div className={styles.actionsMenu} ref={menuRef}>
          <button
            className={styles.menuButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Tùy chọn"
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
                disabled={isArchived}
                className={isArchived ? styles.disabledButton : ""}
              >
                <FontAwesomeIcon icon={faPen} /> Sửa
              </button>
              <button
                onClick={() => {
                  onShowHistory(goal);
                  setIsMenuOpen(false);
                }}
                disabled={isArchived}
                className={isArchived ? styles.disabledButton : ""}
              >
                <FontAwesomeIcon icon={faHistory} /> Lịch sử
              </button>
              <button
                onClick={() => {
                  onDelete(goal._id);
                  setIsMenuOpen(false);
                }}
                className={`${styles.deleteButton} ${isArchived ? styles.disabledButton : ""}`}
                disabled={isArchived}
              >
                <FontAwesomeIcon icon={faTrash} /> Xóa
              </button>
              <button
                onClick={() => {
                  onTogglePin && onTogglePin(goal._id);
                  setIsMenuOpen(false);
                }}
                disabled={isArchived}
                className={isArchived ? styles.disabledButton : ""}
              >
                <FontAwesomeIcon icon={faThumbtack} />
                {isPinned ? " Bỏ ghim" : " Ghim"}
              </button>
              <button
                onClick={() => {
                  onToggleArchive && onToggleArchive(goal._id);
                  setIsMenuOpen(false);
                }}
                // Không disable nút này
              >
                <FontAwesomeIcon icon={faArchive} />
                {isArchived ? " Bỏ lưu trữ" : " Lưu trữ"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.cardBody}>
        {isArchived ? (
          <div className={styles.completedContent}>
            <p>Mục tiêu đã được lưu trữ.</p>
          </div>
        ) : isCompleted ? (
          <div className={styles.completedContent}>
            <span className={styles.celebrationIcon}>🏆</span>
            <p>Mục tiêu đã được chinh phục!</p>
          </div>
        ) : (
          <>
            <div className={styles.progressInfo}>
              <span>Tiến độ</span>
              <span className={styles.progressPercentage}>
                {progress.toFixed(0)}%
              </span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className={styles.amountInfo}>
              <span className={styles.currentAmount}>
                {formatCurrency(goal.currentAmount)}
              </span>
              <span className={styles.targetAmount}>
                / {formatCurrency(goal.targetAmount)}
              </span>
            </div>
          </>
        )}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.deadlineInfo}>
          {formatDeadlineText(goal.deadline, isCompleted)}
        </div>
        {!isArchived &&
          (isCompleted ? (
            <button
              className={styles.archiveButton}
              aria-label="Lưu trữ mục tiêu"
              onClick={() => onToggleArchive && onToggleArchive(goal._id)}
            >
              <FontAwesomeIcon icon={faArchive} /> Lưu trữ
            </button>
          ) : (
            <button
              className={styles.addFundsButton}
              onClick={() => onAddFunds(goal)}
            >
              <FontAwesomeIcon icon={faPlusCircle} /> Nạp tiền
            </button>
          ))}
      </div>
    </div>
  );
}
