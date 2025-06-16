// controllers/transactionController.js
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");

exports.createTransaction = async (req, res) => {
  try {
    const { name, amount, type, categoryId, accountId, date, note } = req.body;

    const newTransaction = new Transaction({
      userId: req.user.id,
      name,
      amount,
      type,
      categoryId,
      accountId,
      date,
      note,
    });

    const savedTransaction = await newTransaction.save();

    const account = await Account.findOne({
      _id: accountId,
      userId: req.user.id,
    });
    if (!account)
      return res.status(404).json({ message: "Tài khoản không tồn tại" });

    if (type === "CHITIEU") account.initialBalance -= amount;
    else if (type === "THUNHAP") account.initialBalance += amount;

    await account.save();

    res.status(201).json(savedTransaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
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
      .populate("categoryId", "name icon type") // Lấy thêm cả icon và type của category
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // ✅ BƯỚC QUAN TRỌNG NHẤT: BIẾN ĐỔI DỮ LIỆU
    const formattedTransactions = transactions.map((t) => ({
      id: t._id, // Đổi _id thành id
      date: t.date,
      description: t.name, // Đổi name thành description
      note: t.note,
      amount: t.amount,
      type: t.type,
      category: t.categoryId, // Giữ nguyên category là object
      paymentMethod: t.accountId, // Đổi accountId thành paymentMethod
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

    const account = await Account.findOne({
      _id: transaction.accountId,
      userId: req.user.id,
    });

    if (account) {
      if (transaction.type === "CHITIEU")
        account.initialBalance += transaction.amount;
      else if (transaction.type === "THUNHAP")
        account.initialBalance -= transaction.amount;
      await account.save();
    }

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

    // 1. Tìm giao dịch cũ để hoàn lại tiền cho tài khoản cũ
    const oldTransaction = await Transaction.findOne({
      _id: transactionId,
      userId: userId,
    });

    if (!oldTransaction) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch." });
    }

    const oldAccount = await Account.findById(oldTransaction.accountId);
    if (oldAccount) {
      // Hoàn lại số tiền của giao dịch CŨ
      if (oldTransaction.type === "CHITIEU") {
        oldAccount.initialBalance += oldTransaction.amount;
      } else {
        oldAccount.initialBalance -= oldTransaction.amount;
      }
      await oldAccount.save();
    }

    // 2. Cập nhật giao dịch với thông tin mới
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      transactionId,
      {
        name,
        amount,
        type,
        categoryId,
        accountId, // Cập nhật tài khoản mới
        date,
        note,
      },
      { new: true } // Trả về bản ghi đã được cập nhật
    );

    // 3. Cập nhật số dư cho tài khoản MỚI (hoặc tài khoản cũ nếu không đổi)
    const newAccount = await Account.findById(accountId);
    if (newAccount) {
      // Trừ đi số tiền của giao dịch MỚI
      if (type === "CHITIEU") {
        newAccount.initialBalance -= amount;
      } else {
        newAccount.initialBalance += amount;
      }
      await newAccount.save();
    }

    res.status(200).json(updatedTransaction);
  } catch (err) {
    res
      .status(500)
      .json({
        error: "Lỗi server khi cập nhật giao dịch.",
        details: err.message,
      });
  }
};
