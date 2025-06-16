// backend/routes/accounts.js
const express = require("express");
const router = express.Router();
const Account = require("../models/Account");
const verifyToken = require("../middleware/verifyToken");

// GET /api/accounts - Lấy tất cả tài khoản
router.get("/", verifyToken, async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    // Chuyển đổi _id thành id và đảm bảo các trường mới được trả về
    const formattedAccounts = accounts.map((acc) => ({
      id: acc._id,
      name: acc.name,
      type: acc.type,
      balance: acc.initialBalance, // Đổi tên thành balance cho nhất quán
      bankName: acc.bankName,
      accountNumber: acc.accountNumber,
      createdAt: acc.createdAt,
    }));
    res.json(formattedAccounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounts - Tạo tài khoản mới
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, type, initialBalance, bankName, accountNumber } = req.body;
    const newAccount = new Account({
      userId: req.user.id,
      name,
      type,
      initialBalance,
      bankName: type === "THENGANHANG" ? bankName : "",
      accountNumber: type === "THENGANHANG" ? accountNumber : "",
    });
    const saved = await newAccount.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/accounts/:id - Cập nhật tài khoản
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { name, bankName, accountNumber } = req.body;
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { name, bankName, accountNumber } },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản." });
    }
    res.json(account);
  } catch (err) {
    // ----> THÊM DÒNG NÀY VÀO ĐÂY <----
    console.error("CHI TIẾT LỖI UPDATE:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/accounts/:id - Xóa tài khoản
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const deletedAccount = await Account.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!deletedAccount) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản." });
    }
    // TODO: Cân nhắc xử lý các giao dịch liên quan đến tài khoản này
    res.json({ message: "Xóa tài khoản thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
