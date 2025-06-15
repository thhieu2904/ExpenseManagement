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

// Lấy xu hướng thu chi theo khoảng thời gian// Thay thế hàm cũ bằng hàm này
exports.getIncomeExpenseTrend = async (req, res) => {
  try {
    const userId = req.user.id;

    // In ra các tham số nhận được để gỡ lỗi
    console.log("Tham số truy vấn đã nhận:", req.query);

    const period = req.query.period || "day";
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month); // Lấy tháng từ query
    const startDateQuery = req.query.startDate
      ? new Date(req.query.startDate)
      : null;
    const days = parseInt(req.query.days);

    let matchStage = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    // Xác định khoảng thời gian để lọc giao dịch
    if (period === "day" && year && month) {
      // Lấy dữ liệu cho các ngày trong một tháng cụ thể
      const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
      const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59));
      matchStage.date = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (period === "day" && startDateQuery && days) {
      // Lấy dữ liệu cho một khoảng ngày tùy chỉnh (ví dụ: một tuần)
      const endDate = new Date(startDateQuery);
      endDate.setUTCDate(startDateQuery.getUTCDate() + days - 1);
      endDate.setUTCHours(23, 59, 59, 999);
      matchStage.date = { $gte: startDateQuery, $lte: endDate };
    } else if (period === "month") {
      // Lấy dữ liệu các tháng trong một năm cụ thể
      const startOfYear = new Date(Date.UTC(year, 0, 1));
      const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
      matchStage.date = { $gte: startOfYear, $lte: endOfYear };
    }
    // Nếu không có điều kiện nào khớp, matchStage sẽ chỉ lọc theo userId (toàn bộ giao dịch)

    // Xác định cách gom nhóm dữ liệu dựa trên period
    let groupByFormat;
    if (period === "year") {
      groupByFormat = "%Y";
    } else if (period === "month") {
      groupByFormat = "%Y-%m";
    } else {
      // Mặc định là 'day'
      groupByFormat = "%Y-%m-%d";
    }

    const result = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            // Sử dụng định dạng đã xác định ở trên
            group: {
              $dateToString: {
                format: groupByFormat,
                date: "$date",
                timezone: "Asia/Ho_Chi_Minh",
              },
            },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: "$_id.group",
          data: { $push: { type: "$_id.type", total: "$total" } },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          income: {
            $ifNull: [
              {
                $let: {
                  vars: {
                    incomeItem: {
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
                  in: "$$incomeItem.total",
                },
              },
              0, // Trả về 0 nếu không có thu nhập
            ],
          },
          expense: {
            $ifNull: [
              {
                $let: {
                  vars: {
                    expenseItem: {
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
                  in: "$$expenseItem.total",
                },
              },
              0, // Trả về 0 nếu không có chi tiêu
            ],
          },
        },
      },
      { $sort: { name: 1 } }, // Sắp xếp kết quả theo ngày/tháng/năm
    ]);

    res.status(200).json(result);
  } catch (err) {
    console.error("Lỗi khi phân tích thu chi:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy thống kê chi tiêu theo danh mục (phiên bản nâng cấp)
exports.getExpenseByCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    // Lấy các tham số từ query, bao gồm cả 'period'
    const { period, year, month, date } = req.query;

    const matchStage = {
      userId: new mongoose.Types.ObjectId(userId),
      type: "CHITIEU",
    };

    let startDate, endDate;

    // Xử lý việc tạo khoảng thời gian dựa trên period
    switch (period) {
      case "year":
        if (year) {
          const parsedYear = parseInt(year);
          startDate = new Date(Date.UTC(parsedYear, 0, 1)); // 1 tháng 1
          endDate = new Date(Date.UTC(parsedYear, 11, 31, 23, 59, 59)); // 31 tháng 12
        }
        break;

      case "month":
        if (year && month) {
          const parsedYear = parseInt(year);
          const parsedMonth = parseInt(month);
          startDate = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1));
          endDate = new Date(Date.UTC(parsedYear, parsedMonth, 0, 23, 59, 59));
        }
        break;

      case "week":
        if (date) {
          const referenceDate = new Date(date);
          referenceDate.setUTCHours(0, 0, 0, 0); // Chuẩn hóa về đầu ngày

          // Tính ngày bắt đầu của tuần (Chủ nhật)
          const dayOfWeek = referenceDate.getUTCDay(); // 0 = Chủ nhật, 1 = Thứ 2...
          startDate = new Date(referenceDate);
          startDate.setUTCDate(referenceDate.getUTCDate() - dayOfWeek);

          // Tính ngày kết thúc của tuần (Thứ 7)
          endDate = new Date(startDate);
          endDate.setUTCDate(startDate.getUTCDate() + 6);
          endDate.setUTCHours(23, 59, 59, 999);
        }
        break;

      default:
        // Nếu không có period, có thể trả về lỗi hoặc một khoảng thời gian mặc định
        return res.status(400).json({
          message: "Thiếu tham số 'period' hợp lệ (week, month, year).",
        });
    }

    // Nếu không thể xác định khoảng thời gian, trả về lỗi
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Thiếu các tham số ngày tháng cần thiết." });
    }

    // Gán khoảng thời gian vào matchStage
    matchStage.date = { $gte: startDate, $lte: endDate };

    // Phần pipeline aggregate phía sau giữ nguyên, nó đã rất tốt rồi
    const result = await Transaction.aggregate([
      { $match: matchStage },
      { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      {
        $facet: {
          topCategories: [
            { $limit: 5 },
            {
              $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "_id",
                as: "categoryInfo",
              },
            },
            { $unwind: "$categoryInfo" },
            {
              $project: {
                _id: 0,
                name: "$categoryInfo.name",
                value: "$total",
                icon: "$categoryInfo.icon",
              },
            },
          ],
          otherCategories: [
            { $skip: 5 },
            { $group: { _id: null, total: { $sum: "$total" } } },
            {
              $project: {
                _id: 0,
                name: "Khác",
                value: "$total",
                icon: "fa-question-circle",
              },
            },
          ],
        },
      },
      {
        $project: {
          data: {
            $concatArrays: [
              "$topCategories",
              {
                $filter: {
                  input: "$otherCategories",
                  as: "other",
                  cond: { $gt: ["$$other.value", 0] },
                },
              },
            ],
          },
        },
      },
    ]);

    res.status(200).json(result[0] ? result[0].data : []);
  } catch (err) {
    console.error("Lỗi khi thống kê theo danh mục:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
