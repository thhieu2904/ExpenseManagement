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
// THAY THẾ TOÀN BỘ HÀM CŨ `getAllTransactions` bằng hàm mới này

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
      // ✅ BỔ SUNG THAM SỐ LỌC THEO KHOẢNG NGÀY
      startDate,
      endDate,
    } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // --- Xây dựng bộ lọc (match criteria) ---
    const matchCriteria = { userId };

    // 1. ✅ LOGIC LỌC THỜI GIAN ĐƯỢC ƯU TIÊN
    if (startDate && endDate) {
      // Ưu tiên lọc theo khoảng ngày nếu được cung cấp
      matchCriteria.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // 2. Lọc theo từ khóa (tên/mô tả giao dịch)
    if (keyword) {
      matchCriteria.name = { $regex: keyword, $options: "i" };
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
      .populate({ path: "accountId", select: "name type" })
      .populate({ path: "categoryId", select: "name icon type" })
      .sort({ date: -1, createdAt: -1 })
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
      paymentMethod: t.accountId,
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

// XÓA GIAO DỊCH
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
    })
      .populate("categoryId")
      .exec();

    if (!transaction)
      return res.status(404).json({ message: "Không tìm thấy giao dịch" });

    // Kiểm tra nếu là giao dịch nạp vào mục tiêu
    const isGoalFund =
      transaction.categoryId &&
      (transaction.categoryId.isGoalFund === true ||
        transaction.categoryId.name === "Tiết kiệm Mục tiêu");

    if (isGoalFund) {
      // 1. Hoàn tiền về tài khoản nguồn
      const account = await Account.findById(transaction.accountId);
      if (account) {
        account.balance += transaction.amount;
        await account.save();
      }

      // 2. Trừ số tiền đã nạp khỏi mục tiêu
      // Ưu tiên dùng goalId nếu có
      let goal = null;
      if (transaction.goalId) {
        goal = await require("../models/Goal").findOne({
          _id: transaction.goalId,
          user: req.user.id,
        });
      } else {
        // Fallback: tìm theo tên mục tiêu như cũ
        let goalName = null;
        if (
          transaction.name &&
          transaction.name.startsWith("Nạp tiền cho mục tiêu:")
        ) {
          goalName = transaction.name
            .replace('Nạp tiền cho mục tiêu: "', "")
            .replace('"', "");
        }
        if (goalName) {
          goal = await require("../models/Goal").findOne({
            user: req.user.id,
            name: goalName,
          });
        }
      }
      if (goal) {
        goal.currentAmount -= transaction.amount;
        if (goal.currentAmount < 0) goal.currentAmount = 0;
        if (
          goal.currentAmount < goal.targetAmount &&
          goal.status === "completed"
        ) {
          goal.status = "in_progress";
        }
        await goal.save();
      }
    }

    // Xóa transaction
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

    const transaction = await Transaction.findOne({
      _id: transactionId,
      userId,
    })
      .populate("categoryId")
      .exec();
    if (!transaction) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch." });
    }

    // Kiểm tra nếu là giao dịch nạp vào mục tiêu
    const isGoalFund =
      transaction.categoryId &&
      (transaction.categoryId.isGoalFund === true ||
        transaction.categoryId.name === "Tiết kiệm Mục tiêu");

    if (isGoalFund) {
      // 1. Nếu đổi tài khoản nguồn
      if (String(accountId) !== String(transaction.accountId)) {
        // Hoàn lại số tiền cũ vào tài khoản cũ
        const oldAccount = await Account.findById(transaction.accountId);
        if (oldAccount) {
          oldAccount.balance += transaction.amount;
          await oldAccount.save();
        }
        // Trừ số tiền mới ở tài khoản mới
        const newAccount = await Account.findById(accountId);
        if (newAccount) {
          newAccount.balance -= amount;
          await newAccount.save();
        }
      } else if (amount !== transaction.amount) {
        // Nếu chỉ đổi số tiền (không đổi tài khoản)
        const diff = amount - transaction.amount;
        const account = await Account.findById(accountId);
        if (account) {
          account.balance -= diff;
          await account.save();
        }
      }

      // 2. Cập nhật lại số tiền đã nạp vào mục tiêu
      let goal = null;
      if (transaction.goalId) {
        goal = await require("../models/Goal").findOne({
          _id: transaction.goalId,
          user: userId,
        });
      }
      if (goal) {
        goal.currentAmount = goal.currentAmount - transaction.amount + amount;
        if (goal.currentAmount < 0) goal.currentAmount = 0;
        if (
          goal.currentAmount < goal.targetAmount &&
          goal.status === "completed"
        ) {
          goal.status = "in_progress";
        }
        if (goal.currentAmount >= goal.targetAmount) {
          goal.status = "completed";
        }
        await goal.save();
      }
    }

    // Cập nhật transaction
    transaction.name = name;
    transaction.amount = amount;
    transaction.type = type;
    transaction.categoryId = categoryId;
    transaction.accountId = accountId;
    transaction.date = date;
    transaction.note = note;
    await transaction.save();

    res.status(200).json(transaction);
  } catch (err) {
    res.status(500).json({
      error: "Lỗi server khi cập nhật giao dịch.",
      details: err.message,
    });
  }
};

// Hiển thị lich giao dịch theo tháng
