const express = require("express");
const router = express.Router();
const {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  addFundsToGoal,
  toggleArchiveGoal,
  togglePinGoal,
  fixGoalCategoriesIcon,
} = require("../controllers/goalController");

const protect = require("../middleware/verifyToken");

// Route này chỉ xóa các mục tiêu Goal của user hiện tại, không xóa user
router.delete("/all", protect, async (req, res) => {
  try {
    const result = await require("../models/Goal").deleteMany({
      user: req.user.id,
    });
    res.json({
      message: "Đã xóa toàn bộ mục tiêu!",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa mục tiêu", error: err.message });
  }
});

// Các route chính
router.route("/").get(protect, getGoals).post(protect, createGoal);

// Route fix icon cho goal categories (phải đặt trước /:id)
router.patch("/fix-categories-icon", protect, fixGoalCategoriesIcon);

router.route("/:id").put(protect, updateGoal).delete(protect, deleteGoal);

// Route đặc biệt để nạp tiền
router.post("/:id/add-funds", protect, addFundsToGoal);

// Route đổi trạng thái archived
router.patch("/:id/archive", protect, toggleArchiveGoal);

// Route đổi trạng thái isPinned
router.patch("/:id/pin", protect, togglePinGoal);

module.exports = router;
