// backend/routes/ai.js
const express = require("express");
const router = express.Router();
const AIController = require("../controllers/aiController");
const verifyToken = require("../middleware/verifyToken");

// Khởi tạo instance của AIController
const aiController = new AIController();

// Route xử lý tin nhắn AI - Frontend gọi POST /api/ai-assistant
router.post("/", verifyToken, aiController.processMessage.bind(aiController));

// Route để tạo giao dịch sau khi AI đã phân tích và người dùng xác nhận
router.post(
  "/create-transaction",
  verifyToken,
  aiController.createTransaction.bind(aiController)
);

// Route để tạo danh mục sau khi AI đã phân tích và người dùng xác nhận
router.post(
  "/create-category",
  verifyToken,
  aiController.createCategory.bind(aiController)
);

// Route để tạo mục tiêu sau khi AI đã phân tích và người dùng xác nhận
router.post(
  "/create-goal",
  verifyToken,
  aiController.createGoal.bind(aiController)
);

module.exports = router;
