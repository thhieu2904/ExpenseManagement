/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Giao dịch thu/chi
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Lấy danh sách giao dịch
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách giao dịch
 *   post:
 *     summary: Tạo giao dịch mới
 *     tags: [Transactions]
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
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [THUNHAP, CHITIEU]
 *               categoryId:
 *                 type: string
 *               accountId:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Giao dịch được tạo thành công
 */

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Xóa giao dịch
 *     tags: [Transactions]
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
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
const verifyToken = require("../middleware/verifyToken");

// Tạo giao dịch mới
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, amount, type, categoryId, accountId, note } = req.body;

    // 1. Tạo transaction
    const newTransaction = new Transaction({
      userId: req.user.id,
      name,
      amount,
      type,
      categoryId,
      accountId,
      note,
    });

    const savedTransaction = await newTransaction.save();

    // 2. Cập nhật số dư tài khoản
    const account = await Account.findOne({
      _id: accountId,
      userId: req.user.id,
    });
    if (!account)
      return res.status(404).json({ message: "Tài khoản không tồn tại" });

    if (type === "CHITIEU") {
      account.initialBalance -= amount;
    } else if (type === "THUNHAP") {
      account.initialBalance += amount;
    }

    await account.save();

    res.status(201).json(savedTransaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy tất cả giao dịch
router.get("/", verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .populate("accountId", "name")
      .populate("categoryId", "name type")
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa giao dịch (và hoàn số dư)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!transaction)
      return res.status(404).json({ message: "Không tìm thấy giao dịch" });

    const account = await Account.findOne({
      _id: transaction.accountId,
      userId: req.user.id,
    });
    if (account) {
      if (transaction.type === "CHITIEU")
        account.initialBalance += transaction.amount;
      else if (transaction.type === "THUNHAP")
        account.initialBalance -= transaction.amount;
      await account.save();
    }

    await Transaction.deleteOne({ _id: transaction._id });

    res.json({ message: "Xóa giao dịch thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
