const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const transactionController = require("../controllers/transactionController");

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
 *               date:
 *                 type: string
 *                 format: date-time
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

router.post("/", verifyToken, transactionController.createTransaction);
router.get("/", verifyToken, transactionController.getAllTransactions);
router.delete('/all', verifyToken, async (req, res) => {
  try {
    const result = await require('../models/Transaction').deleteMany({ userId: req.user.id });
    res.json({ message: 'Đã xóa toàn bộ giao dịch!', deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xóa giao dịch', error: err.message });
  }
});

router.delete("/:id", verifyToken, transactionController.deleteTransaction);
router.put("/:id", verifyToken, transactionController.updateTransaction);

module.exports = router;
