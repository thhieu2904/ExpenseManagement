import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCog } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../../hooks/useTheme";
import SpendingReminderSettings from "./SpendingReminderSettings";
import styles from "./Settings.module.css";

const Settings = ({
  // Dark mode và reminder settings
  reminder,
  setReminder,

  // Import/Export handlers
  handleExportDataRequest,
  fileImportRef,
  handleImportFileChange,
  importedData,
  handleImportDataRequest,
  isImporting,

  // Logout handler
  handleLogout,

  // Messages
  message,
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [isReminderExpanded, setIsReminderExpanded] = useState(false);

  // Debug log to check if functions are passed correctly
  console.log("Settings component props:", {
    handleExportDataRequest: typeof handleExportDataRequest,
    handleImportFileChange: typeof handleImportFileChange,
    handleImportDataRequest: typeof handleImportDataRequest,
    handleLogout: typeof handleLogout,
    fileImportRef: !!fileImportRef,
  });

  return (
    <>
      <h3 className={styles.cardTitle}>
        <FontAwesomeIcon icon={faUserCog} /> Cài đặt
      </h3>

      {/* Message display */}
      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.settingsContent}>
        {/* Dark Mode Toggle */}
        <div className={styles.settingsItem}>
          <span className={styles.settingsLabel}>Chế độ tối (Dark Mode)</span>
          <label className={styles.toggleSwitch}>
            <input
              type="checkbox"
              className={styles.toggleInput}
              checked={isDarkMode}
              onChange={toggleTheme}
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>

        {/* Reminder Toggle */}
        <div className={styles.settingsItem}>
          <span className={styles.settingsLabel}>Nhắc nhở chi tiêu</span>
          <label className={styles.toggleSwitch}>
            <input
              type="checkbox"
              className={styles.toggleInput}
              checked={reminder}
              onChange={(e) => setReminder(e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>

        {/* Spending Reminder Settings - Expandable */}
        <SpendingReminderSettings
          isExpanded={isReminderExpanded}
          onToggle={() => setIsReminderExpanded(!isReminderExpanded)}
        />

        {/* Data Import/Export Section */}
        <div className={styles.dataSection}>
          <label className={styles.sectionLabel}>Xuất/nhập dữ liệu</label>
          <div className={styles.dataButtons}>
            <button
              className={styles.exportBtn}
              onClick={handleExportDataRequest}
            >
              Xuất Dữ Liệu (.json)
            </button>
            <input
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              ref={fileImportRef}
              onChange={handleImportFileChange}
            />
            <button
              className={styles.importBtn}
              onClick={() => fileImportRef.current?.click()}
            >
              Chọn File Để Nhập
            </button>
          </div>

          {/* Import Status */}
          {importedData && (
            <div className={styles.importStatus}>
              <p className={styles.importInfo}>
                Đã chọn file:{" "}
                <strong>{fileImportRef.current?.files[0]?.name}</strong>. Sẵn
                sàng để nhập.
              </p>
              <button
                className={styles.confirmImportBtn}
                onClick={handleImportDataRequest}
                disabled={isImporting}
              >
                {isImporting ? "Đang xử lý..." : "Bắt đầu Nhập Dữ Liệu"}
              </button>
            </div>
          )}
        </div>

        {/* Logout Section */}
        <div className={styles.logoutSection}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
};

export default Settings;
