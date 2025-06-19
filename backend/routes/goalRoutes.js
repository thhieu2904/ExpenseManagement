const express = require("express");
const router = express.Router();
const {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  addFundsToGoal,
} = require("../controllers/goalController");

const protect = require("../middleware/verifyToken");

// Các route chính
router.route("/").get(protect, getGoals).post(protect, createGoal);

router.route("/:id").put(protect, updateGoal).delete(protect, deleteGoal);

// Route đặc biệt để nạp tiền
router.post("/:id/add-funds", protect, addFundsToGoal);

module.exports = router;
