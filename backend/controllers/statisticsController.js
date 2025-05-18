const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

function calcChange(curr, prev) {
  if (prev === 0 && curr === 0) {
    return { percent: 0, desc: "Không thay đổi so với tháng trước" };
  }

  if (prev === 0) {
    return { percent: 100, desc: "Tăng mạnh so với tháng trước" };
  }

  const diff = curr - prev;
  const percent = Math.round((diff / prev) * 100);
  const desc =
    percent >= 0
      ? `Tăng ${percent}% so với tháng trước`
      : `Giảm ${Math.abs(percent)}% so với tháng trước`;

  return { percent, desc };
}

exports.getOverviewStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfThisMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 1)
    );
    const endOfThisMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    );
    const startOfLastMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() - 1, 1)
    );
    const endOfLastMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    );

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

    const sum = (arr, type) =>
      arr.filter((t) => t.type === type).reduce((acc, t) => acc + t.amount, 0);

    const incomeThis = sum(thisMonthTxs, "THUNHAP");
    const expenseThis = sum(thisMonthTxs, "CHITIEU");
    const incomeLast = sum(lastMonthTxs, "THUNHAP");
    const expenseLast = sum(lastMonthTxs, "CHITIEU");

    const balanceThis = incomeThis - expenseThis;
    const balanceLast = incomeLast - expenseLast;

    const incomeChange = calcChange(incomeThis, incomeLast);
    const expenseChange = calcChange(expenseThis, expenseLast);
    const balanceChange = calcChange(balanceThis, balanceLast);

    const monthYear = `${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}/${now.getFullYear()}`;

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
      .json({ error: "Lỗi khi tính thống kê", detail: err.message });
  }
};
exports.getIncomeExpenseTrend = async (req, res) => {
  try {
    const userId = req.user.id;
    const period = req.query.period || "month";
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : null;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    let matchStage = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    // === 1. Lọc theo tuần (7 ngày)
    if (period === "week" && startDate) {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6); // 7 ngày
      matchStage.date = { $gte: startDate, $lte: endDate };
    }

    // === 2. Lọc theo năm (12 tháng)
    else if (period === "month" && year) {
      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year + 1, 0, 1));
      matchStage.date = { $gte: start, $lt: end };
    }

    // === 3. Không lọc gì đặc biệt cho "year" → nhóm theo năm

    const groupBy =
      period === "year"
        ? { $dateToString: { format: "%Y", date: "$date" } }
        : period === "week"
        ? { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
        : { $dateToString: { format: "%Y-%m", date: "$date" } };

    const result = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            group: groupBy,
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: "$_id.group",
          data: {
            $push: {
              type: "$_id.type",
              total: "$total",
            },
          },
        },
      },
      {
        $project: {
          name: "$_id",
          _id: 0,
          income: {
            $let: {
              vars: {
                income: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$data",
                        as: "d",
                        cond: { $eq: ["$$d.type", "THUNHAP"] },
                      },
                    },
                    0,
                  ],
                },
              },
              in: { $ifNull: ["$$income.total", 0] },
            },
          },
          expense: {
            $let: {
              vars: {
                expense: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$data",
                        as: "d",
                        cond: { $eq: ["$$d.type", "CHITIEU"] },
                      },
                    },
                    0,
                  ],
                },
              },
              in: { $ifNull: ["$$expense.total", 0] },
            },
          },
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.status(200).json(result);
  } catch (err) {
    console.error("Lỗi khi phân tích thu chi:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

exports.getOverviewStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const startOfThisMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 1)
    );
    const endOfThisMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    );
    const startOfLastMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() - 1, 1)
    );
    const endOfLastMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    );

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

    const sum = (arr, type) =>
      arr.filter((t) => t.type === type).reduce((acc, t) => acc + t.amount, 0);

    const incomeThis = sum(thisMonthTxs, "THUNHAP");
    const expenseThis = sum(thisMonthTxs, "CHITIEU");
    const incomeLast = sum(lastMonthTxs, "THUNHAP");
    const expenseLast = sum(lastMonthTxs, "CHITIEU");

    const balanceThis = incomeThis - expenseThis;
    const balanceLast = incomeLast - expenseLast;

    const incomeChange = calcChange(incomeThis, incomeLast);
    const expenseChange = calcChange(expenseThis, expenseLast);
    const balanceChange = calcChange(balanceThis, balanceLast);

    const monthYear = `${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}/${now.getFullYear()}`;

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
      .json({ error: "Lỗi khi tính thống kê", detail: err.message });
  }
};
exports.getExpenseByCategory = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: "CHITIEU",
        },
      },
      {
        $group: {
          _id: "$categoryId",
          total: { $sum: "$amount" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $unwind: "$categoryInfo",
      },
      {
        $project: {
          _id: 0,
          category: "$categoryInfo.name",
          total: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json(result);
  } catch (err) {
    console.error("Lỗi khi thống kê theo danh mục:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
