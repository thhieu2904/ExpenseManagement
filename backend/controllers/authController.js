const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const LoginHistory = require("../models/LoginHistory");
// Đăng ký
const register = async (req, res) => {
  try {
    const { username, fullname, password, email } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ message: "Tài khoản đã tồn tại" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, fullname, password: hashed, email });

    res.status(201).json({ message: "Đăng ký thành công", user: newUser });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({ message: "Tài khoản không tồn tại" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Sai mật khẩu" });

    // --- BẮT ĐẦU THÊM LOGIC MỚI ---
    // Ghi lại lịch sử đăng nhập
    await LoginHistory.create({
      userId: user._id,
      ipAddress: req.ip, // Lấy địa chỉ IP từ request
      userAgent: req.headers["user-agent"], // Lấy thông tin trình duyệt
    });
    // --- KẾT THÚC LOGIC MỚI ---

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      account: {
        id: user._id,
        username: user.username,
        fullname: user.fullname,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

const me = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Thiếu token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(
      "fullname username avatar"
    );

    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    res.json({ message: "Đã xác thực", user });
  } catch (err) {
    res.status(401).json({ message: "Token không hợp lệ", error: err.message });
  }
};
module.exports = { register, login, me };

// module.exports = { register, login };
