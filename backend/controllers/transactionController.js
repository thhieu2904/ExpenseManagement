// backend/controllers/transactionController.js
const mongoose = require("mongoose");
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
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Lấy các tham số từ query
    const {
      page = 1,
      limit = 10,
      keyword,
      type,
      categoryId,
      accountId,
      year, // Thêm year và month để lọc theo tháng của DateNavigator
      month,
    } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // --- Xây dựng bộ lọc (match criteria) ---
    const matchCriteria = { userId };

    // 1. Lọc theo tháng/năm từ DateNavigator
    if (year && month) {
      const startDate = new Date(
        Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, 1)
      );
      const endDate = new Date(
        Date.UTC(parseInt(year, 10), parseInt(month, 10), 0, 23, 59, 59)
      );
      matchCriteria.date = { $gte: startDate, $lte: endDate };
    }

    // 2. Lọc theo từ khóa (tên/mô tả giao dịch)
    if (keyword) {
      matchCriteria.name = { $regex: keyword, $options: "i" }; // "i" để không phân biệt hoa thường
    }

    // 3. Lọc theo loại giao dịch
    if (type && type !== "ALL") {
      matchCriteria.type = type;
    }

    // 4. Lọc theo danh mục
    if (categoryId && categoryId !== "ALL") {
      matchCriteria.categoryId = new mongoose.Types.ObjectId(categoryId);
    }

    // 5. Lọc theo tài khoản
    if (accountId && accountId !== "ALL") {
      matchCriteria.accountId = new mongoose.Types.ObjectId(accountId);
    }

    // --- Thực hiện truy vấn ---
    const totalTransactions = await Transaction.countDocuments(matchCriteria);
    const totalPages = Math.ceil(totalTransactions / parseInt(limit, 10));

    const transactions = await Transaction.find(matchCriteria)
      .populate({ path: "accountId", select: "name type" }) // Sử dụng object để chỉ định rõ
      .populate({ path: "categoryId", select: "name icon type" })
      .sort({ date: -1, createdAt: -1 }) // Ưu tiên sắp xếp theo ngày giao dịch
      .skip(skip)
      .limit(parseInt(limit, 10));

    // Format lại dữ liệu trả về (giữ nguyên)
    const formattedTransactions = transactions.map((t) => ({
      id: t._id,
      createdAt: t.createdAt,
      date: t.date,
      description: t.name,
      note: t.note,
      amount: t.amount,
      type: t.type,
      category: t.categoryId,
      paymentMethod: t.accountId, // Giữ tên paymentMethod cho nhất quán với RecentTransactions
    }));

    res.json({
      data: formattedTransactions,
      currentPage: parseInt(page, 10),
      totalPages: totalPages,
      totalCount: totalTransactions,
    });
  } catch (err) {
    console.error("Lỗi khi lấy danh sách giao dịch:", err);
    res.status(500).json({ error: "Lỗi máy chủ", details: err.message });
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

// Hiển thị lich giao dịch theo tháng
