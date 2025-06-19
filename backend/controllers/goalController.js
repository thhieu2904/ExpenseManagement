const asyncHandler = require("express-async-handler");
const Goal = require("../models/Goal");
const Transaction = require("../models/Transaction"); // Import model Transaction
const Category = require("../models/Category");
const Account = require("../models/Account");

// @desc    Lấy tất cả mục tiêu của người dùng
// @route   GET /api/goals
// @access  Private
const getGoals = asyncHandler(async (req, res) => {
  const goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json(goals);
});

// @desc    Tạo mục tiêu mới
// @route   POST /api/goals
// @access  Private
const createGoal = asyncHandler(async (req, res) => {
  const { name, targetAmount, deadline, icon } = req.body;

  if (!name || !targetAmount) {
    res.status(400);
    throw new Error("Tên và Số tiền mục tiêu là bắt buộc");
  }

  const goal = await Goal.create({
    user: req.user.id,
    name,
    targetAmount,
    deadline,
    icon,
  });

  res.status(201).json(goal);
});

// @desc    Cập nhật mục tiêu
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    res.status(404);
    throw new Error("Không tìm thấy mục tiêu");
  }

  // Đảm bảo người dùng chỉ cập nhật mục tiêu của chính mình
  if (goal.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Không được phép");
  }

  const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Trả về document đã được cập nhật
  });

  res.status(200).json(updatedGoal);
});

// @desc    Xóa mục tiêu
// @route   DELETE /api/goals/:id
// @access  Private

const deleteGoal = asyncHandler(async (req, res) => {
  // Sử dụng findOneAndDelete để tìm và xóa trong một bước,
  // đồng thời kiểm tra quyền sở hữu (user: req.user.id)
  const goal = await Goal.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  // Nếu không tìm thấy mục tiêu nào khớp với ID và user ID,
  // có nghĩa là mục tiêu không tồn tại hoặc người dùng không có quyền.
  if (!goal) {
    res.status(404);
    throw new Error("Không tìm thấy mục tiêu hoặc bạn không có quyền xóa");
  }

  // Nếu xóa thành công, trả về id đã xóa
  res.status(200).json({ id: req.params.id });
});

// @desc    Nạp tiền vào mục tiêu
// @route   POST /api/goals/:id/add-funds
// @access  Private
const addFundsToGoal = asyncHandler(async (req, res) => {
  const { amount, accountId } = req.body;
  const goalId = req.params.id;

  if (!amount || amount <= 0 || !accountId) {
    res.status(400);
    throw new Error("Vui lòng nhập số tiền và chọn tài khoản nguồn hợp lệ");
  }

  const account = await Account.findById(accountId);
  if (!account || account.userId.toString() !== req.user.id) {
    res.status(404);
    throw new Error("Không tìm thấy tài khoản nguồn.");
  }
  if (account.balance < amount) {
    res.status(400);
    throw new Error(
      "Số dư trong tài khoản không đủ để thực hiện giao dịch này."
    );
  }

  const goal = await Goal.findById(goalId);
  // ✅ THÊM LẠI CÁC CHECK BỊ THIẾU
  if (!goal) {
    res.status(404);
    throw new Error("Không tìm thấy mục tiêu");
  }
  if (goal.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Không được phép truy cập mục tiêu này");
  }

  // ✅ 2. TÌM HOẶC TẠO CATEGORY "TIẾT KIỆM MỤC TIÊU"
  let savingsCategory = await Category.findOne({
    name: "Tiết kiệm Mục tiêu",
    userId: req.user.id,
  });
  if (!savingsCategory) {
    savingsCategory = await Category.create({
      name: "Tiết kiệm Mục tiêu",
      type: "CHITIEU", // Đảm bảo type này khớp với schema của bạn
      userId: req.user.id,
    });
  }

  // ✅ 3. TẠO TRANSACTION HỢP LỆ THEO ĐÚNG SCHEMA
  const transaction = await Transaction.create({
    userId: req.user.id,
    type: "CHITIEU", // Sử dụng giá trị enum đúng: 'CHITIEU'
    name: `Nạp tiền cho mục tiêu: "${goal.name}"`, // Thêm trường 'name'
    amount: Number(amount),
    date: new Date(),
    accountId: accountId,
    categoryId: savingsCategory._id, // Sử dụng ID của category
    note: `Nạp vào mục tiêu tiết kiệm.`, // Thêm note (tùy chọn nhưng nên có)
  });

  // ... phần cập nhật goal giữ nguyên ...
  goal.currentAmount += Number(amount);
  if (goal.currentAmount >= goal.targetAmount) {
    goal.status = "completed";
  }
  const updatedGoal = await goal.save();

  account.balance -= Number(amount);
  await account.save();
  res.status(200).json({ updatedGoal, transaction });
});

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  addFundsToGoal,
};
