import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Import CSS cho DatePicker
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import styles from "./DateRangeNavigator.module.css"; // File CSS chúng ta sẽ tạo ở bước sau

const DateRangeNavigator = ({
  dateRange,
  onDateChange,
  onPeriodChange,
  period,
}) => {
  const handlePresetClick = (preset) => {
    let startDate, endDate;
    const today = new Date();

    switch (preset) {
      case "week":
        startDate = startOfWeek(today, { weekStartsOn: 1 }); // Bắt đầu từ thứ 2
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case "month":
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case "year":
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
      case "all":
        // Gửi null để backend hiểu là lấy tất cả
        startDate = null;
        endDate = null;
        break;
      default:
        return;
    }

    if (onPeriodChange) onPeriodChange(preset); // Cập nhật period nếu có hàm
    onDateChange({ startDate, endDate });
  };

  return (
    <div className={styles.navigatorContainer}>
      {/* Phần chọn ngày tùy chỉnh */}
      <div className={styles.datePickerGroup}>
        <DatePicker
          selected={dateRange.startDate}
          onChange={(date) => onDateChange({ ...dateRange, startDate: date })}
          selectsStart
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          dateFormat="dd/MM/yyyy"
          className={styles.dateInput}
          placeholderText="Ngày bắt đầu"
        />
        <span className={styles.dateSeparator}>–</span>
        <DatePicker
          selected={dateRange.endDate}
          onChange={(date) => onDateChange({ ...dateRange, endDate: date })}
          selectsEnd
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          minDate={dateRange.startDate}
          dateFormat="dd/MM/yyyy"
          className={styles.dateInput}
          placeholderText="Ngày kết thúc"
        />
      </div>

      {/* Phần chọn nhanh */}
      <div className={styles.presetButtons}>
        <button
          onClick={() => handlePresetClick("week")}
          className={period === "week" ? styles.active : ""}
        >
          Tuần này
        </button>
        <button
          onClick={() => handlePresetClick("month")}
          className={period === "month" ? styles.active : ""}
        >
          Tháng này
        </button>
        <button
          onClick={() => handlePresetClick("year")}
          className={period === "year" ? styles.active : ""}
        >
          Năm nay
        </button>
        <button
          onClick={() => handlePresetClick("all")}
          className={period === "all" ? styles.active : ""}
        >
          Tất cả
        </button>
      </div>
    </div>
  );
};

export default DateRangeNavigator;
