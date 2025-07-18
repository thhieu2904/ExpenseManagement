// backend/routes/ai.js
const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const verifyToken = require("../middleware/verifyToken");

// Route xử lý tin nhắn AI
router.post("/process", verifyToken, aiController.processMessage);

// Route để tạo giao dịch sau khi AI đã phân tích và người dùng xác nhận
router.post("/create-transaction", verifyToken, aiController.createTransaction);

module.exports = router;
