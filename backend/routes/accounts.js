// backend/routes/accounts.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");

// 1. Import controller mới
const accountController = require("../controllers/accountController");

// 2. Sử dụng các hàm từ controller
router.get("/", verifyToken, accountController.getAccounts);
router.post("/", verifyToken, accountController.createAccount);
router.put("/:id", verifyToken, accountController.updateAccount);
router.delete("/:id", verifyToken, accountController.deleteAccount);

module.exports = router;
