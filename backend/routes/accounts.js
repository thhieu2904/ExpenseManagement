// backend/routes/accounts.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");

// 1. Import controller mới
const accountController = require("../controllers/accountController");

// 2. Sử dụng các hàm từ controller
router.get("/", verifyToken, accountController.getAccounts);
router.post("/", verifyToken, accountController.createAccount);
router.put("/:id", verifyToken, accountController.updateAccount);

// Đặt route này TRƯỚC route delete theo id để tránh nhầm lẫn
router.delete('/all', verifyToken, async (req, res) => {
  try {
    console.log('DELETE /accounts/all - req.user:', req.user);
    const result = await require('../models/Account').deleteMany({ userId: req.user.id });
    console.log('Kết quả deleteMany:', result);
    res.json({ message: 'Đã xóa toàn bộ tài khoản!', deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Lỗi xóa toàn bộ tài khoản:', err);
    res.status(500).json({ message: 'Lỗi xóa tài khoản', error: err.message, stack: err.stack });
  }
});

router.delete('/:id', verifyToken, accountController.deleteAccount);

module.exports = router;
