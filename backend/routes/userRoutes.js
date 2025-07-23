/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Quản lý người dùng
 *
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         fullname:
 *           type: string
 *           example: Nguyễn Văn A
 *         username:
 *           type: string
 *           example: nguyenvana
 *         email:
 *           type: string
 *           format: email
 *           example: nguyenvana@email.com
 *         avatar:
 *           type: string
 *           example: /uploads/avatars/avatar.jpg
 *         createdAt:
 *           type: string
 *           format: date-time
 *     LoginHistory:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         loginTime:
 *           type: string
 *           format: date-time
 *         ipAddress:
 *           type: string
 *         userAgent:
 *           type: string
 */

// backend/routes/userRoutes.js

const express = require("express");
const {
  // ...
  getLoginHistory, // Thêm import
  exportUserData, // ✅ Thêm export function
  importUserData, // ✅ Thêm import function
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

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Lấy thông tin hồ sơ người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin hồ sơ người dùng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Không tìm thấy người dùng
 *
 *   put:
 *     summary: Cập nhật thông tin hồ sơ người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Email đã tồn tại
 */

/**
 * @swagger
 * /api/users/avatar:
 *   put:
 *     summary: Cập nhật avatar người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh avatar (jpg, jpeg, png)
 *     responses:
 *       200:
 *         description: Cập nhật avatar thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Đổi mật khẩu
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu cũ không đúng
 */

/**
 * @swagger
 * /api/users/login-history:
 *   get:
 *     summary: Lấy lịch sử đăng nhập
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lịch sử đăng nhập
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LoginHistory'
 */

/**
 * @swagger
 * /api/users/me:
 *   delete:
 *     summary: Xóa tài khoản người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa tài khoản thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tài khoản và toàn bộ dữ liệu đã được xóa thành công.
 */

// Định nghĩa các routes, và dùng `verifyToken` để bảo vệ
router.get("/profile", verifyToken, getUserProfile);
router.put("/profile", verifyToken, updateUserProfile);

// Upload avatar
router.put("/avatar", verifyToken, upload.single("avatar"), updateAvatar);

// Đổi mật khẩu
router.put("/change-password", verifyToken, changePassword);
router.get("/login-history", verifyToken, getLoginHistory);

// ✅ Export/Import routes
router.get("/export", verifyToken, exportUserData);
router.post("/import", verifyToken, importUserData);

router.delete("/me", verifyToken, deleteUserAccount);

module.exports = router;
