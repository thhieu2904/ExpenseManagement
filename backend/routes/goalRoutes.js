/**
 * @swagger
 * tags:
 *   name: Goals
 *   description: Quản lý mục tiêu tiết kiệm
 *
 * components:
 *   schemas:
 *     Goal:
 *       type: object
 *       required:
 *         - name
 *         - targetAmount
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           example: Mua xe máy
 *         targetAmount:
 *           type: number
 *           example: 50000000
 *         currentAmount:
 *           type: number
 *           example: 10000000
 *         deadline:
 *           type: string
 *           format: date
 *         icon:
 *           type: string
 *           example: fa-motorcycle
 *         archived:
 *           type: boolean
 *           default: false
 *         isPinned:
 *           type: boolean
 *           default: false
 *         user:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const express = require("express");
const router = express.Router();
const {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  addFundsToGoal,
  toggleArchiveGoal,
  togglePinGoal,
  fixGoalCategoriesIcon,
  deleteAllGoals,
} = require("../controllers/goalController");

const protect = require("../middleware/verifyToken");

// RESTful: DELETE /goals?deleteAll=true hoặc DELETE /goals/:id
router.delete("/", protect, (req, res) => {
  if (req.query.deleteAll === "true") {
    return deleteAllGoals(req, res);
  }
  res
    .status(400)
    .json({ success: false, message: "Missing goal ID or deleteAll param" });
});

/**
 * @swagger
 * /api/goals/fix-categories-icon:
 *   patch:
 *     summary: Sửa icon cho goal categories
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sửa icon thành công
 */

/**
 * @swagger
 * /api/goals/{id}:
 *   put:
 *     summary: Cập nhật mục tiêu
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của mục tiêu
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Goal'
 *       404:
 *         description: Không tìm thấy mục tiêu
 *
 *   delete:
 *     summary: Xóa mục tiêu
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của mục tiêu
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
 *                   example: Xóa mục tiêu thành công
 *       404:
 *         description: Không tìm thấy mục tiêu
 */

/**
 * @swagger
 * /api/goals/{id}/add-funds:
 *   post:
 *     summary: Nạp tiền vào mục tiêu
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của mục tiêu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Số tiền nạp vào mục tiêu
 *     responses:
 *       200:
 *         description: Nạp tiền thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Goal'
 */

/**
 * @swagger
 * /api/goals/{id}/archive:
 *   patch:
 *     summary: Thay đổi trạng thái lưu trữ mục tiêu
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của mục tiêu
 *     responses:
 *       200:
 *         description: Thay đổi trạng thái thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Goal'
 */

/**
 * @swagger
 * /api/goals/{id}/pin:
 *   patch:
 *     summary: Thay đổi trạng thái ghim mục tiêu
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của mục tiêu
 *     responses:
 *       200:
 *         description: Thay đổi trạng thái ghim thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Goal'
 */

// Các route chính
router.route("/").get(protect, getGoals).post(protect, createGoal);

// Route fix icon cho goal categories (phải đặt trước /:id)
router.patch("/fix-categories-icon", protect, fixGoalCategoriesIcon);

router.route("/:id").put(protect, updateGoal).delete(protect, deleteGoal);

// Route đặc biệt để nạp tiền
router.post("/:id/add-funds", protect, addFundsToGoal);

// Route đổi trạng thái archived
router.patch("/:id/archive", protect, toggleArchiveGoal);

// Route đổi trạng thái isPinned
router.patch("/:id/pin", protect, togglePinGoal);

module.exports = router;
