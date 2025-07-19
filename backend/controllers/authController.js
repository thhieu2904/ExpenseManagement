const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const LoginHistory = require("../models/LoginHistory");
// Đăng ký
const register = async (req, res) => {
  try {
    const { username, fullname, password, email } = req.body;

    // Validate required fields
    if (!username || !fullname || !password) {
      return res.status(400).json({
        message: "Vui lòng điền đầy đủ thông tin bắt buộc.",
      });
    }

    // Validate username format
    if (username.length < 3) {
      return res.status(400).json({
        message: "Tên tài khoản phải có ít nhất 3 ký tự.",
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu phải có ít nhất 6 ký tự.",
      });
    }

    // Kiểm tra username đã tồn tại
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        message: "Tên tài khoản đã tồn tại. Vui lòng chọn tên khác.",
      });
    }

    // Kiểm tra email đã tồn tại (nếu có email)
    if (email && email.trim() && email.trim() !== "") {
      const existingEmail = await User.findOne({
        email: email.trim().toLowerCase(),
      });
      if (existingEmail) {
        return res.status(400).json({
          message: "Email đã được sử dụng. Vui lòng chọn email khác.",
        });
      }
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username: username.trim(),
      fullname: fullname.trim(),
      password: hashed,
      email:
        email && email.trim() && email.trim() !== ""
          ? email.trim().toLowerCase()
          : null,
    });

    // Không trả về password trong response
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      fullname: newUser.fullname,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };

    res.status(201).json({
      message: "Đăng ký thành công",
      user: userResponse,
    });
  } catch (err) {
    console.error("Register error:", err);

    // Xử lý các lỗi MongoDB duplicate key
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const messages = {
        username: "Tên tài khoản đã tồn tại. Vui lòng chọn tên khác.",
        email: "Email đã được sử dụng. Vui lòng chọn email khác.",
      };
      return res.status(400).json({
        message: messages[field] || "Dữ liệu đã tồn tại trong hệ thống.",
      });
    }

    // Xử lý validation errors từ Mongoose
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        message: messages.join(", ") || "Dữ liệu không hợp lệ.",
      });
    }

    // Lỗi generic
    res.status(500).json({
      message: "Lỗi hệ thống. Vui lòng thử lại sau.",
    });
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
      { expiresIn: "12h" }
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
