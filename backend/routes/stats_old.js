const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const verifyToken = require("../middleware/verifyToken");

// Hàm tính phần trăm thay đổi và mô tả
function calcChange(curr, prev) {
  if (prev === 0 && curr === 0) {
    return { percent: 0, desc: "Không thay đổi so với tháng trước" };
  }

  if (prev === 0) {
    return {
      percent: 100,
      desc: "Tăng mạnh so với tháng trước",
    };
  }

  const diff = curr - prev;
  const percent = Math.round((diff / prev) * 100);
  const desc =
    percent >= 0
      ? `Tăng ${percent}% so với tháng trước`
      : `Giảm ${Math.abs(percent)}% so với tháng trước`;

  return { percent, desc };
}

router.get("/overview", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Tháng hiện tại
    const startOfThisMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    );
    const endOfThisMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    );

    // Tháng trước
    const startOfLastMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)
    );
    const endOfLastMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    );

    // Giao dịch tháng này và tháng trước
    const [thisMonthTxs, lastMonthTxs] = await Promise.all([
      Transaction.find({
        userId,
        date: { $gte: startOfThisMonth, $lte: endOfThisMonth },
      }),
      Transaction.find({
        userId,
        date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),
    ]);

    // Tổng thu/chi từng tháng
    const sum = (arr, type) =>
      arr.filter((t) => t.type === type).reduce((acc, t) => acc + t.amount, 0);

    const incomeThis = sum(thisMonthTxs, "THUNHAP");
    const expenseThis = sum(thisMonthTxs, "CHITIEU");
    const incomeLast = sum(lastMonthTxs, "THUNHAP");
    const expenseLast = sum(lastMonthTxs, "CHITIEU");

    const balanceThis = incomeThis - expenseThis;
    const balanceLast = incomeLast - expenseLast;

    // Tính phần trăm và mô tả
    const incomeChange = calcChange(incomeThis, incomeLast);
    const expenseChange = calcChange(expenseThis, expenseLast);
    const balanceChange = calcChange(balanceThis, balanceLast);

    // Định dạng tháng/năm
    const monthYear = `${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}/${now.getFullYear()}`;
    console.log({
      incomeThis,
      incomeLast,
      incomeChange,
      startOfLastMonth,
      endOfLastMonth,
    });
    console.log("=== Kiểm tra toàn bộ giao dịch THUNHAP ===");
    const allIncome = await Transaction.find({ userId, type: "THUNHAP" }).sort({
      date: 1,
    });
    console.log(allIncome.map((t) => ({ name: t.name, date: t.date })));

    console.log("=== Giao dịch tháng trước ===");
    console.log(lastMonthTxs.map((t) => ({ name: t.name, date: t.date })));

    res.json({
      income: {
        amount: incomeThis,
        percentageChange: incomeChange.percent,
        changeDescription: incomeChange.desc,
        monthYear,
      },
      expense: {
        amount: expenseThis,
        percentageChange: expenseChange.percent,
        changeDescription: expenseChange.desc,
        monthYear,
      },
      balance: {
        amount: balanceThis,
        percentageChange: balanceChange.percent,
        changeDescription: balanceChange.desc,
      },
      currentMonthYear: monthYear,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Đã xảy ra lỗi khi tính thống kê", detail: err.message });
  }
});

module.exports = router;
