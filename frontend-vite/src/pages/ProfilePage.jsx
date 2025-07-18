import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faShieldAlt,
  faUserCog,
  faLock,
  faHistory,
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
import ConfirmDialog from "../components/Common/ConfirmDialog";

// Hooks
import { useTheme } from "../hooks/useTheme";

// API Services
import {
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  getLoginHistory,
  deleteAccount as deleteAccountApi,
  getAvatarUrl,
  clearUserData,
} from "../api/profileService";
import { getAccounts, addAccount } from "../api/accountsService";
import { getTransactions, addTransaction } from "../api/transactionsService"; // Thêm addTransaction
import { getCategories, addCategory } from "../api/categoriesService";
import { getGoals, createGoal } from "../api/goalService";

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
  const { isDarkMode, toggleTheme } = useTheme(); // Sử dụng theme context
  const [reminder, setReminder] = useState(false);

  // Import/Export State
  const [importedData, setImportedData] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileImportRef = useRef(null);

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
      const [
        accountsRes,
        transactionsRes,
        profileRes,
        loginHistoryRes,
        categories,
        goalsRes,
      ] = await Promise.all([
        getAccounts({}),
        getTransactions(1, 9999, {}), // Lấy tất cả giao dịch
        getProfile(),
        getLoginHistory(),
        getCategories(),
        getGoals({ limit: 9999, page: 1 }), // ✅ SỬA: Lấy tất cả goals với limit cao
      ]);

      // ✅ THÊM: Debug log để kiểm tra structure
      console.log("Goals API response:", goalsRes);
      console.log("Goals data:", goalsRes.data);

      const exportData = {
        profile: profileRes.data || {},
        accounts: accountsRes || [],
        transactions:
          transactionsRes.data && transactionsRes.data.data
            ? transactionsRes.data.data
            : [],
        categories: categories || [],
        // ✅ SỬA: Xử lý nhiều trường hợp response structure cho goals
        goals: goalsRes.data?.data || goalsRes.data || goalsRes || [],
        loginHistory: loginHistoryRes.data || [],
      };

      // ✅ THÊM: Debug log exported data structure
      console.log("Exported data structure:", {
        profileKeys: Object.keys(exportData.profile),
        accountsCount: exportData.accounts.length,
        categoriesCount: exportData.categories.length,
        goalsCount: exportData.goals.length,
        transactionsCount: exportData.transactions.length,
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
      await clearUserData();
      setSettingsMessage({
        text: "Đã xóa dữ liệu cũ, đang nhập dữ liệu mới...",
        type: "info",
      });

      const categoryIdMap = {};
      if (Array.isArray(importedData.categories)) {
        for (const cat of importedData.categories) {
          const oldCatId = cat._id || cat.id;
          const { _id, id: _id2, userId: _userId, ...catData } = cat;
          try {
            const response = await addCategory(catData);
            const newCat = response.data || response; // Xử lý cả hai trường hợp
            categoryIdMap[oldCatId] = newCat._id || newCat.id;
            console.log(
              `Mapped category: ${oldCatId} -> ${newCat._id || newCat.id}`
            );
          } catch (error) {
            console.error(`Failed to create category:`, cat, error);
          }
        }
      }

      const accountIdMap = {};
      if (Array.isArray(importedData.accounts)) {
        for (const acc of importedData.accounts) {
          const oldAccId = acc._id || acc.id;
          const { _id, id: _id2, userId: _userId, ...accData } = acc;
          try {
            const response = await addAccount(accData);
            console.log("Account API response:", response); // Debug log
            const newAcc = response.data || response; // Xử lý cả hai trường hợp
            const newAccId = newAcc._id || newAcc.id;
            accountIdMap[oldAccId] = newAccId;
            console.log(`Mapped account: ${oldAccId} -> ${newAccId}`, newAcc);
          } catch (error) {
            console.error(`Failed to create account:`, acc, error);
          }
        }
      }

      const goalIdMap = {};
      // ✅ SỬA: Xử lý nhiều format của goals data
      let goalsToProcess = [];
      if (Array.isArray(importedData.goals)) {
        // Direct array format
        goalsToProcess = importedData.goals;
        console.log("Goals format: Direct array");
      } else if (
        importedData.goals &&
        importedData.goals.data &&
        Array.isArray(importedData.goals.data)
      ) {
        // API response format with pagination
        goalsToProcess = importedData.goals.data;
        console.log("Goals format: API response with pagination");
      } else if (importedData.goals && typeof importedData.goals === "object") {
        // Object format, convert to array
        goalsToProcess = Object.values(importedData.goals);
        console.log("Goals format: Object values");
      }

      console.log("Processing goals:", goalsToProcess); // ✅ Debug log
      console.log("Goals count:", goalsToProcess.length);

      if (goalsToProcess.length > 0) {
        for (const goal of goalsToProcess) {
          const oldGoalId = goal._id || goal.id;
          const {
            _id,
            id: _id2,
            user: _user,
            userId: _userId,
            ...goalData
          } = goal; // ✅ Thêm userId vào destructuring
          try {
            console.log("Creating goal with data:", goalData); // ✅ Debug log
            const response = await createGoal(goalData);
            console.log("Goal API response:", response); // Debug log
            const newGoal = response.data || response; // Xử lý cả hai trường hợp
            const newGoalId = newGoal._id || newGoal.id;
            goalIdMap[oldGoalId] = newGoalId;
            console.log(`Mapped goal: ${oldGoalId} -> ${newGoalId}`, newGoal);
          } catch (error) {
            console.error(`Failed to create goal:`, goal, error);
            console.error(
              "Goal creation error details:",
              error.response?.data || error.message
            );
          }
        }
      } else {
        console.log("No goals to import or goals array is empty"); // ✅ Debug log
      }

      if (Array.isArray(importedData.transactions)) {
        for (const tran of importedData.transactions) {
          const newTranData = {
            name: tran.description || tran.name, // Backend yêu cầu 'name', không phải 'description'
            amount: tran.amount,
            type: tran.type,
            date: tran.date,
            note: tran.note || "",
          };

          // Lấy ID cũ từ nhiều trường có thể - cải thiện logic mapping
          const oldCatId =
            tran.category?._id || tran.categoryId || tran.category?.id;
          const oldAccId =
            tran.paymentMethod?._id || tran.accountId || tran.paymentMethod?.id;
          const oldGoalId = tran.goal?._id || tran.goalId || tran.goal?.id;

          // Map category ID
          if (oldCatId && categoryIdMap[oldCatId]) {
            newTranData.categoryId = categoryIdMap[oldCatId];
          }

          // Map account ID
          if (oldAccId && accountIdMap[oldAccId]) {
            newTranData.accountId = accountIdMap[oldAccId];
          }

          // Map goal ID (optional)
          if (oldGoalId && goalIdMap[oldGoalId]) {
            newTranData.goalId = goalIdMap[oldGoalId];
          }

          // Debug log để kiểm tra mapping
          console.log("Mapping transaction:", {
            original: {
              categoryId: oldCatId,
              accountId: oldAccId,
              goalId: oldGoalId,
            },
            mapped: {
              categoryId: newTranData.categoryId,
              accountId: newTranData.accountId,
              goalId: newTranData.goalId,
            },
            maps: {
              categoryExists: !!categoryIdMap[oldCatId],
              accountExists: !!accountIdMap[oldAccId],
              goalExists: !!goalIdMap[oldGoalId],
            },
          });

          // Kiểm tra các trường bắt buộc
          if (
            newTranData.name &&
            newTranData.amount &&
            newTranData.type &&
            newTranData.categoryId &&
            newTranData.accountId
          ) {
            console.log("Creating transaction:", newTranData);
            await addTransaction(newTranData);
          } else {
            console.warn("Bỏ qua giao dịch do thiếu thông tin:", {
              original: tran,
              mapped: newTranData,
              missing: {
                name: !newTranData.name,
                amount: !newTranData.amount,
                type: !newTranData.type,
                categoryId: !newTranData.categoryId,
                accountId: !newTranData.accountId,
              },
              mappingInfo: {
                oldCatId,
                oldAccId,
                categoryMapped: categoryIdMap[oldCatId],
                accountMapped: accountIdMap[oldAccId],
              },
            });
          }
        }
      }

      setSettingsMessage({
        text: "Nhập dữ liệu thành công! Vui lòng tải lại trang để xem dữ liệu mới.",
        type: "success",
      });
      setIsImportDialogOpen(false);
      // Không cần logout nữa!
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
                    // Truyền props cho dark mode (optional, component sẽ tự lấy từ context)
                    darkMode={isDarkMode}
                    setDarkMode={toggleTheme}
                  />
                </div>

                <div className={styles.settingsCard}>
                  <h3 className={styles.cardTitle}>
                    <FontAwesomeIcon icon={faUserCog} /> Cài đặt
                  </h3>
                  {/* ✅ THÊM: Hiển thị thông báo cho cài đặt */}
                  {settingsMessage.text && (
                    <div
                      className={`${styles.message} ${styles[settingsMessage.type]}`}
                    >
                      {settingsMessage.text}
                    </div>
                  )}
                  {/* SỬ DỤNG CẤU TRÚC MỚI */}
                  <div className={styles.settingsContent}>
                    {/* Item 1: Dark Mode */}
                    <div className={styles.settingsItem}>
                      Chế độ tối (Dark Mode)
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

                    {/* Item 2: Reminder */}
                    <div className={styles.settingsItem}>
                      Nhắc nhở chi tiêu
                      <label className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          className={styles.toggleInput}
                          checked={reminder}
                          onChange={() => setReminder((v) => !v)}
                        />
                        <span className={styles.toggleSlider}></span>
                      </label>
                    </div>

                    {/* Item 3: Data Section - Áp dụng class mới */}
                    <div className={styles.dataSection}>
                      <label>Xuất/nhập dữ liệu</label>
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
                          className={styles.exportBtn}
                          style={{ background: "#1a4fa3" }}
                          onClick={() => fileImportRef.current?.click()}
                        >
                          Chọn File Để Nhập
                        </button>
                      </div>
                      {importedData && (
                        <div className={styles.importStatus}>
                          <p>
                            Đã chọn file:{" "}
                            <strong>
                              {fileImportRef.current?.files[0]?.name}
                            </strong>
                            . Sẵn sàng để nhập.
                          </p>
                          <button
                            className={styles.exportBtn}
                            style={{ background: "#22c55e", width: "100%" }}
                            onClick={handleImportDataRequest}
                            disabled={isImporting}
                          >
                            {isImporting
                              ? "Đang xử lý..."
                              : "Bắt đầu Nhập Dữ Liệu"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Logout Button Container - Áp dụng class mới */}
                    <div className={styles.logoutContainer}>
                      <button
                        className={styles.logoutBtn}
                        onClick={handleLogout}
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.contentGrid}>
                <div className={styles.profileCard}>
                  <h3 className={styles.cardTitle}>
                    <FontAwesomeIcon icon={faLock} /> Đổi mật khẩu
                  </h3>
                  <form
                    onSubmit={handlePasswordSubmit}
                    className={styles.passwordForm}
                  >
                    {securityMessage.text && (
                      <div
                        className={`${styles.message} ${styles[securityMessage.type]}`}
                      >
                        {securityMessage.text}
                      </div>
                    )}
                    <div className={styles.formGroup}>
                      <label>Mật khẩu cũ</label>
                      <input
                        type="password"
                        name="oldPassword"
                        value={passwords.oldPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Mật khẩu mới</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwords.newPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Xác nhận mật khẩu mới</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwords.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSecuritySubmitting}
                      className={styles.saveButton}
                    >
                      {isSecuritySubmitting ? "Đang lưu..." : "Lưu mật khẩu"}
                    </button>
                  </form>
                </div>

                <div className={styles.profileCard}>
                  <h3 className={styles.cardTitle}>
                    <FontAwesomeIcon icon={faHistory} /> Lịch sử đăng nhập
                  </h3>
                  <div className={styles.historyContainer}>
                    {loginHistory.length === 0 ? (
                      <p className={styles.noData}>
                        Chưa có dữ liệu đăng nhập.
                      </p>
                    ) : (
                      <ul className={styles.historyList}>
                        {loginHistory.map((entry) => (
                          <li key={entry._id} className={styles.historyItem}>
                            <div className={styles.historyInfo}>
                              <strong>
                                {entry.userAgent.substring(0, 40)}...
                              </strong>
                              <span>IP: {entry.ipAddress}</span>
                            </div>
                            <span className={styles.historyTime}>
                              {new Date(entry.timestamp).toLocaleString(
                                "vi-VN"
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Danger Zone */}
                  <div className={styles.dangerZone}>
                    <h4 className={styles.dangerTitle}>Vùng nguy hiểm</h4>
                    <div className={styles.dangerContent}>
                      <div>
                        <strong>Xóa tài khoản này</strong>
                        <p>Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu.</p>
                      </div>
                      <button
                        onClick={() => setIsDeleteAccountDialogOpen(true)}
                        className={styles.dangerButton}
                      >
                        Xóa tài khoản
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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

      {/* Dialog xác nhận xóa tài khoản */}
      <ConfirmDialog
        isOpen={isDeleteAccountDialogOpen}
        onClose={() => {
          setIsDeleteAccountDialogOpen(false);
          setDialogError("");
        }}
        onConfirm={handleDeleteAccount}
        title="Xác nhận xóa tài khoản"
        message="Bạn có chắc chắn muốn xóa tài khoản của mình không? Toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục."
        confirmText="Xóa tài khoản"
        isProcessing={dialogProcessing}
        errorMessage={dialogError}
      />
    </div>
  );
};

export default ProfilePage;
