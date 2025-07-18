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

// API Services
import {
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  getLoginHistory,
  deleteAccount as deleteAccountApi,
} from "../api/profileService";
import { getAccounts, addAccount } from "../api/accountsService";
import { getTransactions } from "../api/transactionsService"; // Chỉ cần getTransactions
import { getCategories, addCategory } from "../api/categoriesService";
import { getGoals, createGoal } from "../api/goalService";
import axiosInstance from "../api/axiosConfig"; // Import axiosInstance để tạo transaction

// Utils
import { getGreeting, getFullDate } from "../utils/timeHelpers";

// Styles
import styles from "../styles/ProfilePage.module.css";

const clearUserData = async () => {
  await axiosInstance.delete("/accounts/all");
  await axiosInstance.delete("/categories/all");
  await axiosInstance.delete("/transactions/all");
  await axiosInstance.delete("/goals/all");
};

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("info");
  const navigate = useNavigate();

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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Settings State
  const [darkMode, setDarkMode] = useState(false);
  const [reminder, setReminder] = useState(false);

  // Import/Export State
  const [importedData, setImportedData] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileImportRef = useRef(null);

  // --- DATA FETCHING ---
  const fetchProfileData = async () => {
    try {
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
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

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
    setIsConfirmOpen(false);
    try {
      await deleteAccountApi();
      alert("Tài khoản của bạn đã được xóa.");
      handleLogout();
    } catch {
      alert("Không thể xóa tài khoản. Vui lòng thử lại.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // --- IMPORT/EXPORT HANDLERS ---
  const handleExportData = async () => {
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
        getGoals(),
      ]);

      const exportData = {
        profile: profileRes.data || {},
        accounts: accountsRes || [],
        transactions:
          transactionsRes.data && transactionsRes.data.data
            ? transactionsRes.data.data
            : [],
        categories: categories || [],
        goals: goalsRes.data || [],
        loginHistory: loginHistoryRes.data || [],
      };

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `backup_${user.username}_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert(
        "Không thể xuất dữ liệu. " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setImportedData(json);
        alert("Đã đọc dữ liệu từ file. Nhấn nút 'Thực hiện nhập' để tiếp tục.");
      } catch {
        alert("File không hợp lệ hoặc không phải định dạng JSON!");
      }
    };
    reader.readAsText(file);
  };

  const handleImportData = async () => {
    if (!importedData) {
      alert("Vui lòng chọn file dữ liệu trước!");
      return;
    }

    if (
      !window.confirm(
        "CẢNH BÁO: Hành động này sẽ XÓA TOÀN BỘ dữ liệu hiện tại của bạn và thay thế bằng dữ liệu từ file backup. Bạn có chắc chắn muốn tiếp tục không?"
      )
    ) {
      return;
    }

    setIsImporting(true);
    setProfileMessage({
      text: "Bắt đầu quá trình nhập dữ liệu...",
      type: "info",
    });

    try {
      await clearUserData();
      setProfileMessage({
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
      if (Array.isArray(importedData.goals)) {
        for (const goal of importedData.goals) {
          const oldGoalId = goal._id || goal.id;
          const { _id, id: _id2, user: _user, ...goalData } = goal;
          try {
            const response = await createGoal(goalData);
            console.log("Goal API response:", response); // Debug log
            const newGoal = response.data || response; // Xử lý cả hai trường hợp
            const newGoalId = newGoal._id || newGoal.id;
            goalIdMap[oldGoalId] = newGoalId;
            console.log(`Mapped goal: ${oldGoalId} -> ${newGoalId}`, newGoal);
          } catch (error) {
            console.error(`Failed to create goal:`, goal, error);
          }
        }
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
            await axiosInstance.post("/transactions", newTranData);
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

      setProfileMessage({
        text: "Nhập dữ liệu thành công! Vui lòng tải lại trang để xem dữ liệu mới.",
        type: "success",
      });
      // Không cần logout nữa!
    } catch (err) {
      setProfileMessage({
        text:
          "Có lỗi khi nhập dữ liệu: " +
          (err?.response?.data?.message || err.message),
        type: "error",
      });
      console.error("Lỗi nhập dữ liệu:", err);
    } finally {
      setIsImporting(false);
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
      <Header userName={user?.fullname} userAvatar={user?.avatar} />
      <Navbar />

      <main className={styles.pageWrapper}>
        <div className={styles.contentContainer}>
          {/* Header Card */}
          <HeaderCard
            className={styles.profilePageHeader}
            gridIcon={<FontAwesomeIcon icon={faUserCog} />}
            gridTitle={`${getGreeting()}, ${user?.fullname || "Bạn"}!`}
            gridSubtitle="Quản lý thông tin cá nhân"
            gridStats={
              <ProfileStatsWidget
                user={user}
                activeTab={activeTab}
                isLoading={!user.username}
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
                  />
                </div>

                <div className={styles.settingsCard}>
                  <h3 className={styles.cardTitle}>
                    <FontAwesomeIcon icon={faUserCog} /> Cài đặt
                  </h3>
                  {/* SỬ DỤNG CẤU TRÚC MỚI */}
                  <div className={styles.settingsContent}>
                    {/* Item 1: Dark Mode */}
                    <div className={styles.settingsItem}>
                      Chế độ tối (Dark Mode)
                      <label className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          className={styles.toggleInput}
                          checked={darkMode}
                          onChange={() => setDarkMode((v) => !v)}
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
                          onClick={handleExportData}
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
                            onClick={handleImportData}
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
                        onClick={() => setIsConfirmOpen(true)}
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

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Xác nhận xóa tài khoản"
        message="Bạn có chắc chắn muốn xóa tài khoản của mình không? Toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục."
      />
    </div>
  );
};

export default ProfilePage;
