/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Đăng ký & đăng nhập
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               fullname:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin người dùng từ token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về thông tin người dùng đã xác thực
 */

const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const verifyToken = require("../middleware/verifyToken");

// Route chính
router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", verifyToken, authController.me);

module.exports = router;
