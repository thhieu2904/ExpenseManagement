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
    // Logic cập nhật avatar sẽ được thêm ở các tuần sau

    const updatedUser = await user.save();

    res.json({
      id: updatedUser._id,
      fullname: updatedUser.fullname,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
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


module.exports = {
  getUserProfile,
  updateUserProfile,
  updateAvatar,
  changePassword,
  getLoginHistory,
  deleteUserAccount,
};