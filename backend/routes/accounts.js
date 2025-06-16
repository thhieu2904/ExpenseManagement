/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Quản lý nguồn tiền (ví, thẻ)
 */

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
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [TIENMAT, THENGANHANG]
 *               initialBalance:
 *                 type: number
 *     responses:
 *       201:
 *         description: Tạo tài khoản thành công
 */

/**
 * @swagger
 * /api/accounts/{id}:
 *   delete:
 *     summary: Xóa tài khoản
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

const express = require("express");
const router = express.Router();
const Account = require("../models/Account");
const verifyToken = require("../middleware/verifyToken");

// Tạo tài khoản
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, type, initialBalance } = req.body;
    const newAccount = new Account({
      userId: req.user.id,
      name,
      type,
      initialBalance,
    });
    const saved = await newAccount.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy tất cả tài khoản
router.get("/", verifyToken, async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa tài khoản
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Account.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: "Xóa tài khoản thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
