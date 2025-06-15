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
