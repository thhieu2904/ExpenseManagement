/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Quản lý tài khoản ngân hàng
 *
 * components:
 *   schemas:
 *     Account:
 *       type: object
 *       required:
 *         - name
 *         - balance
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           example: Vietcombank
 *         balance:
 *           type: number
 *           example: 1000000
 *         bankName:
 *           type: string
 *           example: Vietcombank
 *         accountNumber:
 *           type: string
 *           example: 1234567890
 *         userId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// backend/routes/accounts.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");

// 1. Import controller mới
const accountController = require("../controllers/accountController");

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Lấy tất cả tài khoản của người dùng
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tài khoản
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Account'
 *
 *   post:
 *     summary: Tạo tài khoản mới
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - balance
 *             properties:
 *               name:
 *                 type: string
 *               balance:
 *                 type: number
 *               bankName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tài khoản được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 */

// 2. Sử dụng các hàm từ controller
router.get("/", verifyToken, accountController.getAccounts);
router.post("/", verifyToken, accountController.createAccount);
router.put("/:id", verifyToken, accountController.updateAccount);

// RESTful: DELETE /accounts?deleteAll=true hoặc DELETE /accounts/:id
router.delete("/", verifyToken, (req, res) => {
  if (req.query.deleteAll === "true") {
    return accountController.deleteAllAccounts(req, res);
  }
  res
    .status(400)
    .json({ success: false, message: "Missing account ID or deleteAll param" });
});

router.delete("/:id", verifyToken, accountController.deleteAccount);

module.exports = router;
