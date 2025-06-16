// backend/controllers/transactionController.js
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
exports.createTransaction = async (req, res) => {
  // console.log("Dữ liệu nhận được ở Backend:", req.body);
  try {
    const { name, amount, type, categoryId, accountId, date, note } = req.body;

    if (!name || amount === undefined || !type || !categoryId || !accountId) {
      return res.status(400).json({
        error: "Dữ liệu không hợp lệ.",
        details: "Thiếu các trường thông tin bắt buộc.",
      });
    }

    // ✅ BƯỚC 1: Đảm bảo 'amount' là một số nguyên an toàn ngay từ đầu
    // Chuyển đổi thành số và làm tròn thành số nguyên gần nhất để loại bỏ mọi sai số
    const transactionAmount = Math.round(Number(amount));

    // Kiểm tra xem sau khi chuyển đổi, nó có phải là một con số hợp lệ không
    if (isNaN(transactionAmount)) {
      return res.status(400).json({ error: "Số tiền không hợp lệ." });
    }

    const newTransaction = new Transaction({
      userId: req.user.id,
      name,
      amount: transactionAmount, // Dùng số tiền an toàn đã được làm tròn
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

    if (!account) {
      // Nếu tài khoản không tồn tại, ta nên cân nhắc việc xóa giao dịch vừa tạo để đảm bảo toàn vẹn dữ liệu
      await Transaction.findByIdAndDelete(savedTransaction._id);
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    // ✅ BƯỚC 2: Sử dụng số nguyên an toàn trong phép tính số dư
    const currentBalance = Math.round(Number(account.initialBalance));

    if (type === "CHITIEU") {
      account.initialBalance = currentBalance - transactionAmount;
    } else if (type === "THUNHAP") {
      account.initialBalance = currentBalance + transactionAmount;
    }

    await account.save();

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

    const oldTransaction = await Transaction.findOne({
      _id: transactionId,
      userId: userId,
    });

    if (!oldTransaction) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch." });
    }

    const oldAccount = await Account.findById(oldTransaction.accountId);
    if (oldAccount) {
      if (oldTransaction.type === "CHITIEU") {
        oldAccount.initialBalance += oldTransaction.amount;
      } else {
        oldAccount.initialBalance -= oldTransaction.amount;
      }
      await oldAccount.save();
    }

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
      { new: true }
    );

    const newAccount = await Account.findById(accountId);
    if (newAccount) {
      if (type === "CHITIEU") {
        newAccount.initialBalance -= amount;
      } else {
        newAccount.initialBalance += amount;
      }
      await newAccount.save();
    }

    res.status(200).json(updatedTransaction);
  } catch (err) {
    res.status(500).json({
      error: "Lỗi server khi cập nhật giao dịch.",
      details: err.message,
    });
  }
};
