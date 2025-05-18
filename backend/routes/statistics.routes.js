const express = require("express");
const router = express.Router();
const statisticsController = require("../controllers/statisticsController");
const verifyToken = require("../middleware/verifyToken");

router.get("/overview", verifyToken, statisticsController.getOverviewStats);
router.get("/trend", verifyToken, statisticsController.getIncomeExpenseTrend);
router.get(
  "/by-category",
  verifyToken,
  statisticsController.getExpenseByCategory
);

module.exports = router;
