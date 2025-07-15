// backend/routes/userRoutes.js


const express = require("express");
const {
    // ...
    getLoginHistory, // Thêm import
  } = require("../controllers/userController");
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  updateAvatar,
  changePassword,
  deleteUserAccount,
} = require("../controllers/userController");
const verifyToken = require("../middleware/verifyToken"); // Dùng middleware `verifyToken` bạn đã có
const upload = require("../middleware/uploadAvatar");

// Định nghĩa các routes, và dùng `verifyToken` để bảo vệ
router.get("/profile", verifyToken, getUserProfile);
router.put("/profile", verifyToken, updateUserProfile);

// Upload avatar
router.put("/avatar", verifyToken, upload.single("avatar"), updateAvatar);

// Đổi mật khẩu
router.put("/change-password", verifyToken, changePassword);
router.get("/login-history", verifyToken, getLoginHistory);
// Lịch sử đăng nhập
router.get("/login-history", verifyToken, getLoginHistory);
router.delete("/me", verifyToken, deleteUserAccount);

module.exports = router;