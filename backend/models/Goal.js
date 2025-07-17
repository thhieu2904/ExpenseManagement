const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: [true, "Vui lòng nhập tên mục tiêu"],
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: [true, "Vui lòng nhập số tiền mục tiêu"],
    },
    currentAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },
    icon: {
      type: String,
      default: "🎯",
    },
    archived: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Goal", goalSchema);
