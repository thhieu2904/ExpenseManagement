const mongoose = require("mongoose");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

// Hàm định dạng ngày thành YYYY-MM-DD để log lỗi cho dễ
const toISODateString = (date) => {
  if (!date) return "N/A";
  return new Date(date).toISOString().split("T")[0];
};

exports.getAccounts = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    let { startDate, endDate } = req.query;

    // Nếu không có ngày, mặc định là không lọc thời gian (cho kết quả mới nhất)
    const isTimeFilterActive = startDate && endDate;

    // 1. Lấy tất cả tài khoản của người dùng
    const accounts = await Account.find({ userId }).lean();

    // 2. Sử dụng Aggregation để tính toán hiệu quả
    const accountCalculations = accounts.map(async (account) => {
      const accountId = account._id;

      // --- Tính toán số dư tại `endDate` ---
      // Nếu không có bộ lọc thời gian, số dư chính là initialBalance (số dư hiện tại)
      let balanceAtEndDate = account.initialBalance;
      if (isTimeFilterActive) {
        const balanceResult = await Transaction.aggregate([
          {
            $match: {
              accountId: accountId,
              // Chỉ lấy các giao dịch từ đầu đến `endDate`
              date: { $lte: new Date(endDate) },
            },
          },
          {
            $group: {
              _id: "$type",
              total: { $sum: "$amount" },
            },
          },
        ]);

        const incomeUntilEndDate =
          balanceResult.find((r) => r._id === "THUNHAP")?.total || 0;
        const expenseUntilEndDate =
          balanceResult.find((r) => r._id === "CHITIEU")?.total || 0;

        // Số dư tại endDate = Số dư ban đầu CỦA TÀI KHOẢN (khi mới tạo) + tổng thu - tổng chi TÍNH TỚI ENDDATE
        // Chú ý: `initialBalance` trong model của bạn đang được cập nhật liên tục, nên nó chính là số dư hiện tại.
        // Cách tính đúng phải dựa trên `initialBalance` gốc hoặc tính lại từ đầu.
        // Tuy nhiên, để đơn giản hóa cho phù hợp với cấu trúc hiện tại, chúng ta sẽ tính toán dựa trên số dư hiện tại và các giao dịch sau endDate.
        // Đây là một điểm cần cải tiến trong tương lai: không nên cập nhật `initialBalance` mà nên tính toán động.

        // Logic tạm thời để phù hợp cấu trúc hiện tại:
        // Lấy số dư hiện tại và điều chỉnh với các giao dịch xảy ra sau endDate
        const adjustments = await Transaction.aggregate([
          {
            $match: {
              accountId: accountId,
              date: { $gt: new Date(endDate) }, // Giao dịch SAU endDate
            },
          },
          {
            $group: {
              _id: "$type",
              total: { $sum: "$amount" },
            },
          },
        ]);

        const incomeAfterEndDate =
          adjustments.find((r) => r._id === "THUNHAP")?.total || 0;
        const expenseAfterEndDate =
          adjustments.find((r) => r._id === "CHITIEU")?.total || 0;

        // Số dư tại endDate = Số dư hiện tại - (thu sau endDate) + (chi sau endDate)
        balanceAtEndDate =
          account.initialBalance - incomeAfterEndDate + expenseAfterEndDate;
      }

      // --- Tính toán thu/chi trong khoảng [startDate, endDate] ---
      let incomeInRange = 0;
      let expenseInRange = 0;
      if (isTimeFilterActive) {
        const rangeResult = await Transaction.aggregate([
          {
            $match: {
              accountId: accountId,
              date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            },
          },
          {
            $group: {
              _id: "$type",
              total: { $sum: "$amount" },
            },
          },
        ]);
        incomeInRange =
          rangeResult.find((r) => r._id === "THUNHAP")?.total || 0;
        expenseInRange =
          rangeResult.find((r) => r._id === "CHITIEU")?.total || 0;
      }

      return {
        id: account._id,
        name: account.name,
        type: account.type,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        createdAt: account.createdAt,
        balance: balanceAtEndDate,
        // Giữ tên key `monthly...` để frontend không phải sửa nhiều
        monthlyIncome: incomeInRange,
        monthlyExpense: expenseInRange,
      };
    });

    const formattedAccounts = await Promise.all(accountCalculations);

    res.json(formattedAccounts);
  } catch (err) {
    console.error(`Lỗi khi lấy danh sách tài khoản:`, err);
    res
      .status(500)
      .json({ error: "Lỗi máy chủ nội bộ.", details: err.message });
  }
};

exports.createAccount = async (req, res) => {
  // Logic tạo tài khoản của bạn ở đây
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
};

exports.updateAccount = async (req, res) => {
  // Logic cập nhật của bạn ở đây
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
    console.error("CHI TIẾT LỖI UPDATE:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  // Logic xóa của bạn ở đây
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
};
