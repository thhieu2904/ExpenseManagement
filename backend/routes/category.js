/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Quản lý danh mục thu/chi
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [THUNHAP, CHITIEU]
 *         icon:
 *           type: string
 *           example: fa-wallet
 *         userId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         totalAmount:
 *           type: number
 *           description: Tổng số tiền của các giao dịch thuộc danh mục
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Lấy tất cả danh mục của người dùng (kèm tổng số tiền)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *
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
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [THUNHAP, CHITIEU]
 *               icon:
 *                 type: string
 *                 example: fa-utensils
 *     responses:
 *       201:
 *         description: Danh mục được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Cập nhật danh mục
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của danh mục
 *     requestBody:
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
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Không tìm thấy danh mục
 *
 *   delete:
 *     summary: Xoá danh mục
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của danh mục
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Xóa danh mục thành công
 *       404:
 *         description: Không tìm thấy danh mục
 */

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

router.get("/", verifyToken, getCategories);
router.post("/", verifyToken, createCategory);
router.put("/:id", verifyToken, updateCategory);

router.delete('/all', require('../middleware/verifyToken'), async (req, res) => {
  try {
    const result = await require('../models/Category').deleteMany({ userId: req.user.id });
    res.json({ message: 'Đã xóa toàn bộ danh mục!', deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xóa danh mục', error: err.message });
  }
});

router.delete('/:id', verifyToken, deleteCategory);

module.exports = router;
