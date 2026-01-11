import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faShieldAlt,
  faUserCog,
  faLock,
} from "@fortawesome/free-solid-svg-icons";

// Components
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import HeaderCard from "../components/Common/HeaderCard";
import PageContentContainer from "../components/Common/PageContentContainer";
import ProfileStatsWidget from "../components/Common/ProfileStatsWidget";
import TabFilter from "../components/Common/TabFilter";
import ProfileInfo from "../components/Profile/ProfileInfo";
import SecuritySettings from "../components/Profile/SecuritySettings";
import Settings from "../components/Profile/Settings";
import ConfirmDialog from "../components/Common/ConfirmDialog";

// Hooks

// API Services
import {
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  getLoginHistory,
  deleteAccount as deleteAccountApi,
  getAvatarUrl,
  exportUserData, // ✅ Export function
  importUserData, // ✅ Import function
} from "../api/profileService";

// Utils
import { getGreeting, getFullDate } from "../utils/timeHelpers";

// Styles
import styles from "../styles/ProfilePage.module.css";

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("info");
  const navigate = useNavigate();
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Profile Info State
  const [user, setUser] = useState({
    fullname: "",
    username: "",
    avatar: "",
    email: "",
  });
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });
  const [settingsMessage, setSettingsMessage] = useState({
    text: "",
    type: "",
  }); // ✅ THÊM: Thông báo riêng cho cài đặt
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Security State
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [securityMessage, setSecurityMessage] = useState({
    text: "",
    type: "",
  });
  const [isSecuritySubmitting, setIsSecuritySubmitting] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);

  // Dialog States
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] =
    useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImportWarningDialogOpen, setIsImportWarningDialogOpen] =
    useState(false);
  const [dialogProcessing, setDialogProcessing] = useState(false);
  const [dialogError, setDialogError] = useState("");

  // Settings State
  const [reminder, setReminder] = useState(false);

  // Import/Export State
  const [importedData, setImportedData] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileImportRef = useRef(null);

  // Load reminder setting from localStorage
  useEffect(() => {
    const savedReminderSetting = localStorage.getItem(
      "spendingReminderEnabled"
    );
    if (savedReminderSetting !== null) {
      setReminder(JSON.parse(savedReminderSetting));
    } else {
      // Check if there are detailed spending reminder settings
      const detailedSettings = localStorage.getItem("spendingReminderSettings");
      if (detailedSettings) {
        try {
          const parsedSettings = JSON.parse(detailedSettings);
          setReminder(parsedSettings.enabled || false);
        } catch (error) {
          console.error("Error parsing spending reminder settings:", error);
        }
      }
    }
  }, []);

  // Save reminder setting to localStorage when it changes
  const handleReminderChange = (newValue) => {
    setReminder(newValue);
    localStorage.setItem("spendingReminderEnabled", JSON.stringify(newValue));

    // Also update the detailed settings if they exist
    const detailedSettings = localStorage.getItem("spendingReminderSettings");
    if (detailedSettings) {
      try {
        const parsedSettings = JSON.parse(detailedSettings);
        parsedSettings.enabled = newValue;
        localStorage.setItem(
          "spendingReminderSettings",
          JSON.stringify(parsedSettings)
        );
      } catch (error) {
        console.error(
          "Error updating detailed spending reminder settings:",
          error
        );
      }
    }
  };

  // --- DATA FETCHING ---
  const fetchProfileData = async () => {
    try {
      setIsProfileLoading(true);
      const [profileRes, historyRes] = await Promise.all([
        getProfile(),
        getLoginHistory(),
      ]);
      setUser(profileRes.data);
      setFullname(profileRes.data.fullname);
      setEmail(profileRes.data.email || "");
      setLoginHistory(historyRes.data);
    } catch (error) {
      setProfileMessage({
        text: "Không thể tải thông tin người dùng.",
        type: "error",
      });
      console.error("Lỗi tải dữ liệu profile:", error);
    } finally {
      setIsProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // ✅ THÊM: Clear thông báo khi chuyển tab
  useEffect(() => {
    setSettingsMessage({ text: "", type: "" });
    setProfileMessage({ text: "", type: "" });
  }, [activeTab]);

  // --- PROFILE INFO HANDLERS ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsProfileSubmitting(true);
    try {
      const { data } = await updateProfile(fullname, email);
      setProfileMessage({ text: "Cập nhật thành công!", type: "success" });
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const updatedUser = {
        ...storedUser,
        fullname: data.fullname,
        email: data.email,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      // Cân nhắc không reload lại trang để trải nghiệm người dùng tốt hơn
    } catch (error) {
      setProfileMessage({
        text: error.response?.data?.message || "Cập nhật thất bại.",
        type: "error",
      });
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const { data } = await updateAvatar(formData);
      setProfileMessage({ text: "Đổi avatar thành công!", type: "success" });
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const updatedUser = { ...storedUser, avatar: data.avatar };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event("storage")); // Bắn sự kiện để Header cập nhật
    } catch (error) {
      setProfileMessage({
        text: error.response?.data?.message || "Upload ảnh thất bại.",
        type: "error",
      });
    }
  };

  // --- SECURITY HANDLERS ---
  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passwords;
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ text: "Mật khẩu mới không khớp!", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setSecurityMessage({
        text: "Mật khẩu mới phải có ít nhất 6 ký tự.",
        type: "error",
      });
      return;
    }
    setIsSecuritySubmitting(true);
    setSecurityMessage({ text: "", type: "" });
    try {
      await changePassword(oldPassword, newPassword);
      setSecurityMessage({ text: "Đổi mật khẩu thành công!", type: "success" });
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setSecurityMessage({
        text: error.response?.data?.message || "Có lỗi xảy ra.",
        type: "error",
      });
    } finally {
      setIsSecuritySubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDialogProcessing(true);
    setDialogError("");

    try {
      await deleteAccountApi();
      setIsDeleteAccountDialogOpen(false);
      setProfileMessage({
        text: "Tài khoản của bạn đã được xóa.",
        type: "success",
      });
      handleLogout();
    } catch {
      setDialogError("Không thể xóa tài khoản. Vui lòng thử lại.");
    } finally {
      setDialogProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // --- IMPORT/EXPORT HANDLERS ---
  const handleExportDataRequest = () => {
    setIsExportDialogOpen(true);
    setDialogError("");
    setSettingsMessage({ text: "", type: "" }); // Clear thông báo cũ
  };

  const handleExportDataConfirm = async () => {
    setDialogProcessing(true);
    setDialogError("");

    console.clear(); // ✅ Clear console để dễ debug
    console.log("=== Starting Export Process ===");

    try {
      // ✅ SỬA: Sử dụng backend API thay vì gọi nhiều APIs riêng lẻ
      const exportResult = await exportUserData();
      console.log("Export API response:", exportResult);

      const exportData = exportResult.data;

      // ✅ THÊM: Debug log exported data structure
      console.log("Exported data structure:", {
        profileKeys: Object.keys(exportData.user || {}),
        accountsCount: (exportData.accounts || []).length,
        categoriesCount: (exportData.categories || []).length,
        goalsCount: (exportData.goals || []).length,
        transactionsCount: (exportData.transactions || []).length,
        version: exportData.version,
      });

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `backup_${user.username}_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExportDialogOpen(false);
      setSettingsMessage({
        text: "Xuất dữ liệu thành công!",
        type: "success",
      });
    } catch (error) {
      setDialogError(
        "Không thể xuất dữ liệu. " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setDialogProcessing(false);
    }
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSettingsMessage({ text: "", type: "" }); // Clear thông báo cũ
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setImportedData(json);
        setIsImportDialogOpen(true);
        setDialogError("");
      } catch {
        setSettingsMessage({
          text: "File không hợp lệ hoặc không phải định dạng JSON!",
          type: "error",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImportDataRequest = () => {
    if (!importedData) {
      setSettingsMessage({
        text: "Vui lòng chọn file dữ liệu trước!",
        type: "error",
      });
      return;
    }
    setIsImportWarningDialogOpen(true);
    setDialogError("");
  };

  const handleImportDataConfirm = async () => {
    setDialogProcessing(true);
    setDialogError("");
    setIsImportWarningDialogOpen(false);
    setIsImporting(true);

    console.clear(); // ✅ Clear console để dễ debug
    console.log("=== Starting Import Process ===");

    setSettingsMessage({
      text: "Bắt đầu quá trình nhập dữ liệu...",
      type: "info",
    });

    // ✅ THÊM: Debug log để kiểm tra imported data structure
    console.log("Imported data structure:", {
      hasProfile: !!importedData.profile,
      hasAccounts: !!importedData.accounts,
      accountsLength: Array.isArray(importedData.accounts)
        ? importedData.accounts.length
        : 0,
      hasCategories: !!importedData.categories,
      categoriesLength: Array.isArray(importedData.categories)
        ? importedData.categories.length
        : 0,
      hasGoals: !!importedData.goals,
      goalsLength: Array.isArray(importedData.goals)
        ? importedData.goals.length
        : 0,
      hasTransactions: !!importedData.transactions,
      transactionsLength: Array.isArray(importedData.transactions)
        ? importedData.transactions.length
        : 0,
    });

    try {
      // ✅ SỬA: Sử dụng backend import API để xử lý toàn bộ với clearExisting = true
      const importResult = await importUserData(importedData, true); // ✅ Xóa dữ liệu cũ trước khi import
      console.log("Import API response:", importResult);

      setSettingsMessage({
        text: `Nhập dữ liệu thành công! Đã nhập ${importResult.stats?.goals || 0} mục tiêu, ${importResult.stats?.accounts || 0} tài khoản, ${importResult.stats?.categories || 0} danh mục, ${importResult.stats?.transactions || 0} giao dịch.`,
        type: "success",
      });

      // ✅ Refresh data sau khi import
      setTimeout(() => {
        window.location.reload(); // Reload để cập nhật UI với data mới
      }, 2000);

      setIsImportDialogOpen(false);
    } catch (err) {
      setDialogError(
        "Có lỗi khi nhập dữ liệu: " +
          (err?.response?.data?.message || err.message)
      );
      console.error("Lỗi nhập dữ liệu:", err);
    } finally {
      setIsImporting(false);
      setDialogProcessing(false);
    }
  };

  // Helper functions cho header
  const getSmartContext = () => {
    if (activeTab === "info") {
      return "Quản lý thông tin cá nhân và cài đặt tài khoản";
    } else {
      return "Cấu hình bảo mật và theo dõi hoạt động đăng nhập";
    }
  };

  const getMoodEmoji = () => {
    const emojis =
      activeTab === "info" ? ["👤", "✏️", "⚙️"] : ["🔒", "🛡️", "🔐"];
    return emojis[Math.floor(Math.random() * emojis.length)];
  };

  // Tabs configuration
  const tabs = [
    {
      key: "info",
      label: "Thông tin tài khoản",
      icon: <FontAwesomeIcon icon={faUser} />,
    },
    {
      key: "security",
      label: "Bảo mật",
      icon: <FontAwesomeIcon icon={faShieldAlt} />,
    },
  ];

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Header
        userName={!isProfileLoading ? user?.fullname : undefined}
        userAvatar={!isProfileLoading ? user?.avatar : undefined}
      />
      <Navbar />

      <main className={styles.pageWrapper}>
        <div className={styles.contentContainer}>
          {/* Header Card */}
          <HeaderCard
            className={styles.profilePageHeader}
            gridIcon={<FontAwesomeIcon icon={faUserCog} />}
            gridTitle={`${getGreeting()}, ${!isProfileLoading && user?.fullname ? user.fullname : "Bạn"}!`}
            gridSubtitle="Quản lý thông tin cá nhân"
            gridStats={
              <ProfileStatsWidget
                user={user}
                activeTab={activeTab}
                isLoading={isProfileLoading}
              />
            }
            gridInfo={
              <>
                <div className="smartContext">
                  <span className="contextText">{getSmartContext()}</span>
                  <span className="moodEmoji">{getMoodEmoji()}</span>
                </div>
                <span className="miniStats">{getFullDate()}</span>
              </>
            }
          />

          {/* Main Content */}
          <PageContentContainer
            title="Quản Lý Tài Khoản"
            titleIcon={activeTab === "info" ? faUser : faLock}
            titleIconColor="#3f51b5"
            showDateFilter={false}
            headerExtra={
              <TabFilter
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={tabs}
              />
            }
          >
            {activeTab === "info" ? (
              <div className={styles.contentGrid}>
                {/* Profile Info Card */}
                <div className={styles.profileCard}>
                  <h3 className={styles.cardTitle}>
                    <FontAwesomeIcon icon={faUser} /> Thông tin cá nhân
                  </h3>
                  <ProfileInfo
                    user={user}
                    fullname={fullname}
                    setFullname={setFullname}
                    message={profileMessage}
                    isSubmitting={isProfileSubmitting}
                    handleUpdateProfile={handleUpdateProfile}
                    handleAvatarChange={handleAvatarChange}
                    fileInputRef={fileInputRef}
                    email={email}
                    setEmail={setEmail}
                    getAvatarUrl={getAvatarUrl}
                  />
                </div>

                {/* Settings Card */}
                <div className={styles.profileCard}>
                  <Settings
                    reminder={reminder}
                    setReminder={handleReminderChange}
                    handleExportDataRequest={handleExportDataRequest}
                    fileImportRef={fileImportRef}
                    handleImportFileChange={handleImportFileChange}
                    importedData={importedData}
                    handleImportDataRequest={handleImportDataRequest}
                    isImporting={isImporting}
                    handleLogout={handleLogout}
                    message={settingsMessage}
                  />
                </div>
              </div>
            ) : (
              <SecuritySettings
                passwords={passwords}
                message={securityMessage}
                isSubmitting={isSecuritySubmitting}
                loginHistory={loginHistory}
                isConfirmOpen={isDeleteAccountDialogOpen}
                setIsConfirmOpen={setIsDeleteAccountDialogOpen}
                handlePasswordSubmit={handlePasswordSubmit}
                handleChange={handlePasswordChange}
                handleDeleteAccount={handleDeleteAccount}
              />
            )}
          </PageContentContainer>
        </div>
      </main>

      <Footer />

      {/* Dialog xác nhận xuất dữ liệu */}
      <ConfirmDialog
        isOpen={isExportDialogOpen}
        onClose={() => {
          setIsExportDialogOpen(false);
          setDialogError("");
        }}
        onConfirm={handleExportDataConfirm}
        title="Xác nhận xuất dữ liệu"
        message="Bạn có muốn xuất toàn bộ dữ liệu của mình ra file JSON không? File sẽ bao gồm: thông tin cá nhân, tài khoản, giao dịch, danh mục, mục tiêu và lịch sử đăng nhập."
        confirmText="Xuất dữ liệu"
        isProcessing={dialogProcessing}
        errorMessage={dialogError}
      />

      {/* Dialog xác nhận chọn file */}
      <ConfirmDialog
        isOpen={isImportDialogOpen}
        onClose={() => {
          setIsImportDialogOpen(false);
          setDialogError("");
        }}
        onConfirm={() => {
          setIsImportDialogOpen(false);
          setIsImportWarningDialogOpen(true);
        }}
        title="File đã được đọc thành công"
        message={`Đã đọc dữ liệu từ file "${fileImportRef.current?.files[0]?.name}". Bạn có muốn tiếp tục quá trình nhập dữ liệu không?`}
        confirmText="Tiếp tục"
        errorMessage={dialogError}
      />

      {/* Dialog cảnh báo trước khi nhập */}
      <ConfirmDialog
        isOpen={isImportWarningDialogOpen}
        onClose={() => {
          setIsImportWarningDialogOpen(false);
          setDialogError("");
        }}
        onConfirm={handleImportDataConfirm}
        title="⚠️ CẢNH BÁO QUAN TRỌNG"
        message="Hành động này sẽ XÓA TOÀN BỘ dữ liệu hiện tại của bạn (tài khoản, giao dịch, danh mục, mục tiêu) và thay thế bằng dữ liệu từ file backup. Thao tác này KHÔNG THỂ HOÀN TÁC. Bạn có chắc chắn muốn tiếp tục không?"
        confirmText="Tôi hiểu và muốn tiếp tục"
        isProcessing={dialogProcessing}
        errorMessage={dialogError}
      />
    </div>
  );
};

export default ProfilePage;
