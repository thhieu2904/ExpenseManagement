// backend/controllers/userController.js
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const LoginHistory = require("../models/LoginHistory");
// Thêm vào đầu file userController.js
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
const Category = require("../models/Category");
const Goal = require("../models/Goal");

// @desc    Lấy thông tin hồ sơ người dùng
// @route   GET /api/users/profile
// @access  Private (Cần xác thực)
const getUserProfile = asyncHandler(async (req, res) => {
  // req.user được gán từ middleware `verifyToken`
  const user = await User.findById(req.user.id).select("-password");

  if (user) {
    res.json({
      id: user._id,
      fullname: user.fullname,
      username: user.username,
      avatar: user.avatar,
      email: user.email,
      createdAt: user.createdAt,
    });
  } else {
    res.status(404);
    throw new Error("Không tìm thấy người dùng.");
  }
});

// @desc    Cập nhật hồ sơ người dùng
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    user.fullname = req.body.fullname || user.fullname;
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ message: "Email đã tồn tại." });
      }
      user.email = req.body.email;
    }
    // Logic cập nhật avatar sẽ được thêm ở các tuần sau

    const updatedUser = await user.save();

    res.json({
      id: updatedUser._id,
      fullname: updatedUser.fullname,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
      email: updatedUser.email,
    });
  } else {
    res.status(404);
    throw new Error("Không tìm thấy người dùng.");
  }
});

// Upload avatar
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Không có file được upload.");
  }
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error("Không tìm thấy người dùng.");
  }
  user.avatar = `/uploads/avatars/${req.file.filename}`;
  await user.save();
  res.json({ message: "Cập nhật avatar thành công", avatar: user.avatar });
});

// Đổi mật khẩu
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error("Không tìm thấy người dùng.");
  }
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    res.status(400);
    throw new Error("Mật khẩu cũ không đúng.");
  }
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: "Đổi mật khẩu thành công." });
});
const getLoginHistory = asyncHandler(async (req, res) => {
  const history = await LoginHistory.find({ userId: req.user.id })
    .sort({ timestamp: -1 }) // Sắp xếp mới nhất lên đầu
    .limit(10); // Giới hạn 10 bản ghi gần nhất
  res.json(history);
});
const deleteUserAccount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Xóa tất cả dữ liệu liên quan
  await Transaction.deleteMany({ userId });
  await Account.deleteMany({ userId });
  await Category.deleteMany({ userId });
  await Goal.deleteMany({ user: userId });
  await LoginHistory.deleteMany({ userId });

  // Cuối cùng, xóa người dùng
  await User.findByIdAndDelete(userId);

  res.json({ message: "Tài khoản và toàn bộ dữ liệu đã được xóa thành công." });
});

// ✅ THÊM: Export user data
const exportUserData = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all user data
    const [user, accounts, categories, transactions, goals] = await Promise.all(
      [
        User.findById(userId).select("-password"),
        Account.find({ userId }),
        Category.find({ userId }),
        Transaction.find({ userId }).populate("categoryId accountId"),
        Goal.find({ user: userId }), // ✅ Fetch ALL goal fields
      ]
    );

    // ✅ Ensure goals include all necessary fields
    const exportData = {
      user: {
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      accounts: accounts.map((account) => ({
        _id: account._id,
        name: account.name,
        type: account.type,
        balance: account.balance,
        icon: account.icon,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      })),
      categories: categories.map((category) => ({
        _id: category._id,
        name: category.name,
        type: category.type,
        icon: category.icon,
        isGoalCategory: category.isGoalCategory,
        goalId: category.goalId,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      })),
      transactions: transactions.map((transaction) => ({
        _id: transaction._id,
        type: transaction.type,
        name: transaction.name,
        amount: transaction.amount,
        date: transaction.date,
        accountId: transaction.accountId,
        categoryId: transaction.categoryId,
        note: transaction.note,
        goalId: transaction.goalId,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      })),
      // ✅ Include ALL goal fields including completion and pin status
      goals: goals.map((goal) => ({
        _id: goal._id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline,
        icon: goal.icon,
        status: goal.status, // ✅ Export completion status
        isPinned: goal.isPinned, // ✅ Export pin status
        archived: goal.archived, // ✅ Export archive status
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      })),
      exportedAt: new Date(),
      version: "1.2", // ✅ Update version
    };

    res.status(200).json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500);
    throw new Error("Lỗi khi xuất dữ liệu");
  }
});

// ✅ THÊM: Import user data
const importUserData = asyncHandler(async (req, res) => {
  const { data } = req.body;

  if (!data) {
    res.status(400);
    throw new Error("Dữ liệu không hợp lệ");
  }

  try {
    const userId = req.user.id;
    let importStats = {
      accounts: 0,
      categories: 0,
      transactions: 0,
      goals: 0,
      errors: [],
    };

    // ✅ Import Goals with ALL fields
    if (data.goals && Array.isArray(data.goals)) {
      for (const goalData of data.goals) {
        try {
          // Check if goal already exists
          const existingGoal = await Goal.findOne({
            user: userId,
            name: goalData.name,
            targetAmount: goalData.targetAmount,
          });

          if (!existingGoal) {
            await Goal.create({
              user: userId,
              name: goalData.name,
              targetAmount: goalData.targetAmount,
              currentAmount: goalData.currentAmount || 0,
              deadline: goalData.deadline,
              icon: goalData.icon || "🎯",
              status: goalData.status || "in-progress", // ✅ Import completion status
              isPinned: goalData.isPinned || false, // ✅ Import pin status
              archived: goalData.archived || false, // ✅ Import archive status
              createdAt: goalData.createdAt || new Date(),
              updatedAt: goalData.updatedAt || new Date(),
            });
            importStats.goals++;
          }
        } catch (goalError) {
          importStats.errors.push(
            `Goal "${goalData.name}": ${goalError.message}`
          );
        }
      }
    }

    // Import other data types similarly...
    // (Account, Category, Transaction import logic would go here)

    res.status(200).json({
      success: true,
      message: "Nhập dữ liệu thành công",
      stats: importStats,
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500);
    throw new Error("Lỗi khi nhập dữ liệu");
  }
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateAvatar,
  changePassword,
  getLoginHistory,
  deleteUserAccount,
  exportUserData, // ✅ Export function
  importUserData, // ✅ Import function
};
