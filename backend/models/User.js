const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" }, // ✅ thêm dòng này
    email: {
      type: String,
      required: false, // ✅ Không bắt buộc email
      unique: true,
      sparse: true, // ✅ Cho phép multiple null values
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
