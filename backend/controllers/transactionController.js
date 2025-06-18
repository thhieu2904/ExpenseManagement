// backend/controllers/transactionController.js
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
exports.createTransaction = async (req, res) => {
  try {
    const { name, amount, type, categoryId, accountId, date, note } = req.body;

    if (!name || amount === undefined || !type || !categoryId || !accountId) {
      return res.status(400).json({
        error: "Dữ liệu không hợp lệ.",
        details: "Thiếu các trường thông tin bắt buộc.",
      });
    }

    const transactionAmount = Math.round(Number(amount));

    if (isNaN(transactionAmount)) {
      return res.status(400).json({ error: "Số tiền không hợp lệ." });
    }

    const newTransaction = new Transaction({
      userId: req.user.id,
      name,
      amount: transactionAmount,
      type,
      categoryId,
      accountId,
      date,
      note,
    });

    const savedTransaction = await newTransaction.save();

    // ✅ BỎ HOÀN TOÀN LOGIC CẬP NHẬT ACCOUNT.INITIALBALANCE
    // Đoạn code cập nhật account.initialBalance đã được xóa khỏi đây

    res.status(201).json(savedTransaction);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ error: "Dữ liệu không hợp lệ.", details: err.message });
    }
    console.error("Lỗi khi tạo giao dịch:", err);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ.", details: err.message });
  }
};

// Lấy tất cả giao dịch của người dùng với phân trang
exports.getAllTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const totalTransactions = await Transaction.countDocuments({ userId });
    const totalPages = Math.ceil(totalTransactions / limit);

    const transactions = await Transaction.find({ userId })
      .populate("accountId", "name type")
      .populate("categoryId", "name icon type")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedTransactions = transactions.map((t) => ({
      id: t._id,
      createdAt: t.createdAt,
      date: t.date,
      description: t.name,
      note: t.note,
      amount: t.amount,
      type: t.type,
      category: t.categoryId,
      paymentMethod: t.accountId,
    }));

    res.json({
      data: formattedTransactions,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!transaction)
      return res.status(404).json({ message: "Không tìm thấy giao dịch" });

    // ✅ BỎ HOÀN TOÀN LOGIC CẬP NHẬT LẠI SỐ DƯ KHI XÓA

    await Transaction.deleteOne({ _id: transaction._id });

    res.json({ message: "Xóa giao dịch thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id: transactionId } = req.params;
    const userId = req.user.id;
    const { name, amount, type, categoryId, accountId, date, note } = req.body;

    // ✅ BỎ HOÀN TOÀN LOGIC HOÀN TRẢ SỐ DƯ CŨ VÀ CẬP NHẬT SỐ DƯ MỚI

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      transactionId,
      {
        name,
        amount,
        type,
        categoryId,
        accountId,
        date,
        note,
      },
      { new: true, runValidators: true } // Thêm runValidators để đảm bảo dữ liệu mới hợp lệ
    );

    if (!updatedTransaction) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch." });
    }

    res.status(200).json(updatedTransaction);
  } catch (err) {
    res.status(500).json({
      error: "Lỗi server khi cập nhật giao dịch.",
      details: err.message,
    });
  }
};
