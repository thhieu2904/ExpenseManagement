/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Quản lý danh mục thu/chi
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Lấy tất cả danh mục của người dùng
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 *   post:
 *     summary: Tạo danh mục mới
 *     tags: [Categories]
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
 *                 enum: [THUNHAP, CHITIEU]
 *     responses:
 *       201:
 *         description: Tạo danh mục thành công
 */

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Xóa danh mục
 *     tags: [Categories]
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
const Category = require("../models/Category");
const verifyToken = require("../middleware/verifyToken");

// Tạo danh mục mới
router.post("/", verifyToken, async (req, res) => {
  try {
    const newCat = new Category({
      userId: req.user.id,
      name: req.body.name,
      type: req.body.type,
    });
    const saved = await newCat.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xem tất cả danh mục của user
router.get("/", verifyToken, async (req, res) => {
  try {
    const cats = await Category.find({ userId: req.user.id });
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa 1 danh mục
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Category.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    res.json({ message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
