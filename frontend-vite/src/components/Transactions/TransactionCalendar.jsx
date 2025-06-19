// Mở và THAY THẾ file: frontend-vite/src/components/Transactions/TransactionCalendar.jsx

import React, { useMemo } from "react"; // ✅ Thêm 'useMemo'
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import styles from "./TransactionCalendar.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowUp,
  faBalanceScale,
} from "@fortawesome/free-solid-svg-icons";

// Hàm tiện ích định dạng tiền tệ (Sử dụng hàm này để hiển thị đẹp hơn)
const formatFullCurrency = (amount) => {
  if (typeof amount !== "number") return "0 ₫";
  return amount.toLocaleString("vi-VN") + " ₫";
};

// Hàm định dạng số tiền thu gọn cho các ô trong lịch
const formatCompactCurrency = (amount) => {
  if (typeof amount !== "number" || amount === 0) return null;
  if (Math.abs(amount) >= 1000000) {
    return `${(amount / 1000000).toLocaleString("vi-VN", {
      maximumFractionDigits: 2,
    })} Tr`;
  }
  if (Math.abs(amount) >= 1000) {
    return `${(amount / 1000).toLocaleString("vi-VN")} N`;
  }
  return `${amount.toLocaleString("vi-VN")}`;
};

const TransactionCalendar = ({ currentDate, calendarData }) => {
  const validCurrentDate =
    currentDate instanceof Date ? currentDate : new Date();

  // ✅ BƯỚC 1: TÍNH TOÁN TỔNG THU/CHI/SỐ DƯ CHO THÁNG HIỆN TẠI
  // Dùng `useMemo` để việc tính toán chỉ chạy lại khi `calendarData` hoặc `currentDate` thay đổi
  const monthSummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    if (calendarData && typeof calendarData === "object") {
      Object.keys(calendarData).forEach((dateKey) => {
        // Chỉ tính các ngày thuộc tháng đang xem
        if (isSameMonth(new Date(dateKey), validCurrentDate)) {
          const dayData = calendarData[dateKey];
          totalIncome += dayData.income || 0;
          totalExpense += dayData.expense || 0;
        }
      });
    }

    return {
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [calendarData, validCurrentDate]);

  // Logic tính ngày tháng (giữ nguyên)
  const firstDayOfMonth = startOfMonth(validCurrentDate);
  const lastDayOfMonth = endOfMonth(validCurrentDate);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 });
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 0 });
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];

  return (
    // ✅ THAY ĐỔI CẤU TRÚC Ở ĐÂY
    // calendarContainer sẽ là một Grid container
    <div className={styles.calendarContainer}>
      {/* Phần lưới lịch sẽ nằm trong một div riêng để dễ dàng đặt vào grid area */}
      <div className={styles.gridSection}>
        <div className={styles.weekDaysGrid}>
          {weekDays.map((day) => (
            <div key={day} className={styles.weekDay}>
              {day}
            </div>
          ))}
        </div>
        <div className={styles.daysGrid}>
          {daysInMonth.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayData =
              calendarData && typeof calendarData === "object"
                ? calendarData[dateKey]
                : null;
            const isCurrentMonth = isSameMonth(day, validCurrentDate);

            // ✅ THÊM TOOLTIP VÀO ĐÂY
            const tooltipText = dayData
              ? `Thu: ${formatFullCurrency(
                  dayData.income
                )}\nChi: ${formatFullCurrency(dayData.expense)}`
              : null;

            return (
              <div
                key={dateKey}
                className={`${styles.dayCell} ${
                  !isCurrentMonth ? styles.notCurrentMonth : ""
                }`}
                // Sử dụng thuộc tính data-* để tạo tooltip bằng CSS
                data-tooltip={tooltipText}
              >
                <span className={styles.dayNumber}>{format(day, "d")}</span>
                {dayData && (
                  <div className={styles.dayContent}>
                    {dayData.income > 0 && (
                      <div className={styles.income}>
                        +{formatCompactCurrency(dayData.income)}
                      </div>
                    )}
                    {dayData.expense > 0 && (
                      <div className={styles.expense}>
                        -{formatCompactCurrency(dayData.expense)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ✅ BƯỚC 2: THÊM JSX ĐỂ HIỂN THỊ PHẦN TÓM TẮT */}
      <div className={styles.summarySection}>
        <div className={styles.summaryItem}>
          <div className={`${styles.summaryIconWrapper} ${styles.incomeBg}`}>
            <FontAwesomeIcon icon={faArrowDown} className={styles.income} />
          </div>
          <div>
            <span className={styles.summaryLabel}>Tổng thu nhập</span>
            <p className={`${styles.summaryAmount} ${styles.income}`}>
              {formatFullCurrency(monthSummary.income)}
            </p>
          </div>
        </div>

        <div className={styles.summaryItem}>
          <div className={`${styles.summaryIconWrapper} ${styles.expenseBg}`}>
            <FontAwesomeIcon icon={faArrowUp} className={styles.expense} />
          </div>
          <div>
            <span className={styles.summaryLabel}>Tổng chi tiêu</span>
            <p className={`${styles.summaryAmount} ${styles.expense}`}>
              {formatFullCurrency(monthSummary.expense)}
            </p>
          </div>
        </div>

        <div className={styles.summaryItem}>
          <div className={`${styles.summaryIconWrapper} ${styles.balanceBg}`}>
            <FontAwesomeIcon icon={faBalanceScale} className={styles.balance} />
          </div>
          <div>
            <span className={styles.summaryLabel}>Số dư cuối kỳ</span>
            <p className={`${styles.summaryAmount} ${styles.balance}`}>
              {formatFullCurrency(monthSummary.balance)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionCalendar;
