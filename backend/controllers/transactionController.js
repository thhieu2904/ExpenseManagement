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
    const transactions = await Transaction.find({ userId: req.user.id })
      .populate("accountId", "name")
      .populate("categoryId", "name type")
      .sort({ createdAt: -1 });

    res.json(transactions);
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
