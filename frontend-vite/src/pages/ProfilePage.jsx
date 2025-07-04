import React, { useState, useEffect, useRef } from "react";
import Header from "../components/Header/Header";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import ProfileInfo from "../components/Profile/ProfileInfo";
import SecuritySettings from "../components/Profile/SecuritySettings";
import styles from "../styles/ProfilePage.module.css";
import axiosInstance from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import {
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  getLoginHistory,
  deleteAccount as deleteAccountApi,
} from "../api/profileService";
import ProfilePageHeader from "../components/Profile/ProfilePageHeader";
import Papa from "papaparse";
import { getAccounts } from "../api/accountsService";
import { getTransactions } from "../api/transactionsService";
import { getCategories } from "../api/categoriesService";
import { getGoals } from "../api/goalService";

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("info");

  // Profile Info State
  const [user, setUser] = useState({ fullname: "", username: "", avatar: "", email: "" });
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
  const [securityMessage, setSecurityMessage] = useState({ text: "", type: "" });
  const [isSecuritySubmitting, setIsSecuritySubmitting] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const navigate = useNavigate();

  // State cho các toggle
  const [darkMode, setDarkMode] = useState(false);
  const [reminder, setReminder] = useState(false);

  // State cho import file
  const [importedData, setImportedData] = useState(null);
  const fileImportRef = useRef(null);

  // Fetch profile info
  const fetchProfile = async () => {
    try {
      const { data } = await getProfile();
      setUser(data);
      setFullname(data.fullname);
      setEmail(data.email || "");
    } catch (error) {
      setProfileMessage({ text: "Không thể tải thông tin.", type: "error" });
    }
  };

  // Fetch login history
  const fetchLoginHistory = async () => {
    try {
      const { data } = await getLoginHistory();
      setLoginHistory(data);
    } catch (error) {
      // Có thể log lỗi nếu cần
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchLoginHistory();
  }, []);

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsProfileSubmitting(true);
    try {
      const { data } = await updateProfile(fullname, email);
      setProfileMessage({ text: "Cập nhật thành công!", type: "success" });
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const updatedUser = { ...storedUser, fullname: data.fullname, avatar: data.avatar };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.location.reload();
    } catch (error) {
      setProfileMessage({ text: "Cập nhật thất bại.", type: "error" });
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  // Update avatar
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
      window.location.reload();
    } catch (error) {
      setProfileMessage({ text: "Upload ảnh thất bại.", type: "error" });
    }
  };

  // Handle password change
  const handleChange = (e) => {
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
      setSecurityMessage({ text: "Mật khẩu mới phải có ít nhất 6 ký tự.", type: "error" });
      return;
    }
    setIsSecuritySubmitting(true);
    setSecurityMessage({ text: "", type: "" });
    try {
      await changePassword(oldPassword, newPassword);
      setSecurityMessage({ text: "Đổi mật khẩu thành công!", type: "success" });
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setSecurityMessage({ text: error.response?.data?.message || "Có lỗi xảy ra.", type: "error" });
    } finally {
      setIsSecuritySubmitting(false);
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    setIsConfirmOpen(false);
    try {
      await deleteAccountApi();
      alert("Tài khoản của bạn đã được xóa.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      alert("Không thể xóa tài khoản. Vui lòng thử lại.");
    }
  };

  // Thêm hàm đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleExportData = async () => {
    try {
      // Lấy dữ liệu tài khoản
      const accountsRes = await getAccounts({});
      const accounts = accountsRes || [];

      // Lấy tất cả giao dịch (không phân trang)
      const transactionsRes = await getTransactions(1, 1000, {});
      const transactions = transactionsRes.data || [];

      // Lấy profile
      const profileRes = await getProfile();
      const profile = profileRes.data || {};

      // Lấy login history
      const loginHistoryRes = await getLoginHistory();
      const loginHistory = loginHistoryRes.data || [];

      // Lấy categories
      const categories = await getCategories();

      // Lấy goals
      const goalsRes = await getGoals();
      const goals = goalsRes.data || [];

      // Gom tất cả vào 1 object
      const exportData = {
        profile,
        accounts,
        transactions,
        categories,
        goals,
        loginHistory
      };

      // Xuất ra file JSON
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "backup_expense_data.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Không thể xuất dữ liệu.");
    }
  };

  // Xử lý chọn file import
  const handleImportFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setImportedData(json);
        alert("Đã đọc dữ liệu từ file. Sẵn sàng để nhập vào hệ thống!");
      } catch (err) {
        alert("File không hợp lệ hoặc không phải JSON!");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={styles.pageContainer}>
      <Header />
      <Navbar />
      <ProfilePageHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className={styles.mainContent}>
        {activeTab === "info" && (
          <div className={styles.infoSettingsGrid}>
            <div className={styles.infoCardWrapper}>
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
              <div className={styles.settingsCardTitle}>Cài đặt</div>
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
              <div className={styles.settingsItem} style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                <span>Xuất/nhập dữ liệu tài khoản (CSV, JSON)</span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className={styles.exportBtn} onClick={handleExportData}>Xuất dữ liệu</button>
                  <input
                    type="file"
                    accept="application/json"
                    style={{ display: 'none' }}
                    ref={fileImportRef}
                    onChange={handleImportFileChange}
                  />
                  <button
                    className={styles.exportBtn}
                    style={{ background: '#1a4fa3' }}
                    onClick={() => fileImportRef.current && fileImportRef.current.click()}
                  >Nhập dữ liệu</button>
                </div>
              </div>
              <div style={{width: '100%', display: 'flex', justifyContent: 'flex-end'}}>
                <button className={styles.logoutBtn} onClick={handleLogout}>Đăng xuất</button>
              </div>
            </div>
          </div>
        )}
        {activeTab === "security" && (
          <SecuritySettings
            passwords={passwords}
            setPasswords={setPasswords}
            message={securityMessage}
            isSubmitting={isSecuritySubmitting}
            loginHistory={loginHistory}
            isConfirmOpen={isConfirmOpen}
            setIsConfirmOpen={setIsConfirmOpen}
            handlePasswordSubmit={handlePasswordSubmit}
            handleChange={handleChange}
            handleDeleteAccount={handleDeleteAccount}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;