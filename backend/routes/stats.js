/**
 * @swagger
 * tags:
 *   name: Stats
 *   description: Thống kê giao dịch
 */

/**
 * @swagger
 * /api/stats/overview:
 *   get:
 *     summary: Thống kê tổng thu, chi, số dư tháng hiện tại
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tổng thu chi trong tháng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalIncome:
 *                   type: number
 *                 totalExpense:
 *                   type: number
 *                 balance:
 *                   type: number
 */

/**
 * @swagger
 * /api/stats/by-category:
 *   get:
 *     summary: Tổng chi theo danh mục (có tên danh mục)
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tổng chi theo từng danh mục kèm tên
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID danh mục
 *                   total:
 *                     type: number
 *                   category:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [THUNHAP, CHITIEU]
 */

/**
 * @swagger
 * /api/stats/by-date:
 *   get:
 *     summary: Biểu đồ thu chi theo ngày
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tổng thu/chi theo từng ngày
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Ngày (YYYY-MM-DD)
 *                   types:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           enum: [THUNHAP, CHITIEU]
 *                         total:
 *                           type: number
 */

const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const verifyToken = require("../middleware/verifyToken");

// Tổng thu, chi tháng hiện tại
router.get("/overview", verifyToken, async (req, res) => {
  try {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date();

    const transactions = await Transaction.find({
      userId: req.user.id,
      date: { $gte: start, $lte: end },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    for (let tx of transactions) {
      if (tx.type === "THUNHAP") totalIncome += tx.amount;
      if (tx.type === "CHITIEU") totalExpense += tx.amount;
    }

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tổng chi theo danh mục
router.get("/by-category", verifyToken, async (req, res) => {
  try {
    const data = await Transaction.aggregate([
      { $match: { userId: req.user._id, type: "CHITIEU" } },
      {
        $group: {
          _id: "$categoryId",
          total: { $sum: "$amount" },
        },
      },
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Biểu đồ theo ngày
router.get("/by-date", verifyToken, async (req, res) => {
  try {
    const data = await Transaction.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$date" },
            },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          types: {
            $push: {
              type: "$_id.type",
              total: "$total",
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
