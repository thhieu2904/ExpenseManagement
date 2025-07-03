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

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("info");

  // Profile Info State
  const [user, setUser] = useState({ fullname: "", username: "", avatar: "" });
  const [fullname, setFullname] = useState("");
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

  // Fetch profile info
  const fetchProfile = async () => {
    try {
      const { data } = await getProfile();
      setUser(data);
      setFullname(data.fullname);
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
      const { data } = await updateProfile(fullname);
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

  return (
    <div className={styles.pageContainer}>
      <Header />
      <Navbar />
      <main className={styles.mainContent}>
        <div className={styles.profileCard}>
          <div className={styles.tabs}>
            <button
              onClick={() => setActiveTab("info")}
              className={activeTab === "info" ? styles.activeTab : ""}
            >
              Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={activeTab === "security" ? styles.activeTab : ""}
            >
              Bảo mật & Tài khoản
            </button>
          </div>
          <div className={styles.tabContent}>
            {activeTab === "info" && (
              <ProfileInfo
                user={user}
                fullname={fullname}
                setFullname={setFullname}
                message={profileMessage}
                isSubmitting={isProfileSubmitting}
                handleUpdateProfile={handleUpdateProfile}
                handleAvatarChange={handleAvatarChange}
                fileInputRef={fileInputRef}
              />
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;