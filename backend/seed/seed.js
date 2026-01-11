/**
 * Seed Script - Import dữ liệu mẫu vào MongoDB
 *
 * Cách chạy:
 *   node seed/seed.js          - Xóa data cũ và seed data mới
 *   node seed/seed.js --keep   - Giữ data cũ, chỉ thêm demo user nếu chưa có
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Import Models
const User = require("../models/User");
const Account = require("../models/Account");
const Category = require("../models/Category");
const Transaction = require("../models/Transaction");
const Goal = require("../models/Goal");

// Import Seed Data
const {
  demoUser,
  accounts,
  categories,
  transactions,
  goals,
} = require("./seedData");

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Kết nối MongoDB thành công");

    const keepData = process.argv.includes("--keep");

    if (!keepData) {
      // Xóa toàn bộ data cũ
      console.log("🗑️  Đang xóa dữ liệu cũ...");
      await Promise.all([
        User.deleteMany({}),
        Account.deleteMany({}),
        Category.deleteMany({}),
        Transaction.deleteMany({}),
        Goal.deleteMany({}),
      ]);
      console.log("✅ Đã xóa dữ liệu cũ");
    }

    // Kiểm tra user demo đã tồn tại chưa
    let user = await User.findOne({ username: demoUser.username });

    if (!user) {
      // Tạo user mới
      const hashedPassword = await bcrypt.hash("123456", 10);
      user = await User.create({
        ...demoUser,
        password: hashedPassword,
      });
      console.log("✅ Tạo user demo thành công");
      console.log("   📧 Username: demo");
      console.log("   🔑 Password: 123456");
    } else {
      console.log("ℹ️  User demo đã tồn tại");
    }

    const userId = user._id;

    // Tạo Accounts
    const createdAccounts = await Account.insertMany(
      accounts.map((acc) => ({ ...acc, userId }))
    );
    console.log(`✅ Tạo ${createdAccounts.length} tài khoản`);

    // Tạo Categories
    const createdCategories = await Category.insertMany(
      categories.map((cat) => ({
        ...cat,
        userId,
        isGoalCategory: false,
        goalId: null,
      }))
    );
    console.log(`✅ Tạo ${createdCategories.length} danh mục`);

    // Tạo map để lookup
    const accountMap = {};
    createdAccounts.forEach((acc) => {
      accountMap[acc.name] = acc._id;
    });

    const categoryMap = {};
    createdCategories.forEach((cat) => {
      categoryMap[cat.name] = cat._id;
    });

    // Tạo Transactions
    const transactionsToCreate = transactions.map((tx) => {
      const date = new Date();
      date.setDate(date.getDate() - tx.daysAgo);

      return {
        userId,
        name: tx.name,
        amount: tx.amount,
        type: tx.type,
        accountId: accountMap[tx.accountName],
        categoryId: categoryMap[tx.categoryName],
        date,
        note: "",
      };
    });

    const createdTransactions = await Transaction.insertMany(
      transactionsToCreate
    );
    console.log(`✅ Tạo ${createdTransactions.length} giao dịch`);

    // Tạo Goals
    const createdGoals = await Goal.insertMany(
      goals.map((goal) => ({ ...goal, user: userId }))
    );
    console.log(`✅ Tạo ${createdGoals.length} mục tiêu`);

    // Summary
    console.log("\n🎉 SEED THÀNH CÔNG!");
    console.log("================================");
    console.log(`   Users:        1`);
    console.log(`   Accounts:     ${createdAccounts.length}`);
    console.log(`   Categories:   ${createdCategories.length}`);
    console.log(`   Transactions: ${createdTransactions.length}`);
    console.log(`   Goals:        ${createdGoals.length}`);
    console.log("================================\n");
    console.log("🔐 Đăng nhập với: demo / 123456");
  } catch (error) {
    console.error("❌ Lỗi seed database:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("📤 Đã ngắt kết nối MongoDB");
    process.exit(0);
  }
};

seedDatabase();
