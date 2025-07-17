const mongoose = require("mongoose");
const User = require("../../models/User");
const Transaction = require("../../models/Transaction");
const Category = require("../../models/Category");
const Account = require("../../models/Account");
const Goal = require("../../models/Goal");

class UtilsHelper {
  // Trích xuất số tiền từ text
  extractAmount(text) {
    if (!text) return null;

    // Các pattern để nhận diện số tiền
    const patterns = [
      /(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|million)/i, // X triệu
      /(\d+(?:[.,]\d+)?)\s*(?:nghìn|k|thousand)/i, // X nghìn
      /(\d+(?:[.,]\d+)?)\s*(?:đ|dong|VND|vnđ)/i, // X đồng
      /(\d+(?:[.,]\d+)*)/, // Chỉ số
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let amount = parseFloat(match[1].replace(/,/g, "."));

        // Xử lý đơn vị
        const fullMatch = match[0].toLowerCase();
        if (
          fullMatch.includes("triệu") ||
          fullMatch.includes("tr") ||
          fullMatch.includes("million")
        ) {
          amount *= 1000000;
        } else if (
          fullMatch.includes("nghìn") ||
          fullMatch.includes("k") ||
          fullMatch.includes("thousand")
        ) {
          amount *= 1000;
        }

        return Math.round(amount);
      }
    }

    return null;
  }

  // Lấy context của user
  async getUserContext(userId) {
    try {
      console.log("Getting user context for userId:", userId);

      // Convert userId to ObjectId if needed
      const userObjectId =
        typeof userId === "string"
          ? new mongoose.Types.ObjectId(userId)
          : userId;

      // Lấy tất cả categories của user
      const categories = await Category.find({ userId: userObjectId });
      console.log("Found categories:", categories.length);

      // Lấy tất cả accounts của user
      const accounts = await Account.find({ userId: userObjectId });
      console.log("Found accounts:", accounts.length);

      // Lấy một số transaction gần đây để AI hiểu pattern
      const recentTransactions = await Transaction.find({
        userId: userObjectId,
      })
        .sort({ date: -1 })
        .limit(5)
        .populate("categoryId", "name type")
        .populate("accountId", "name type");
      console.log("Found recent transactions:", recentTransactions.length);

      // Đảm bảo data structure đúng format
      const categoryList = categories.map((c) => ({
        name: c.name || "Unnamed Category",
        type: c.type || "CHITIEU",
      }));

      const accountList = accounts.map((a) => ({
        name: a.name || "Unnamed Account",
        type: a.type || "TIENMAT",
        balance: a.balance || 0,
        bankName: a.bankName || null,
      }));

      const transactionList = recentTransactions.map((t) => ({
        name: t.name || "Unnamed Transaction",
        amount: t.amount || 0,
        type: t.type || "CHITIEU",
        category: t.categoryId?.name || "Không có danh mục",
        account: t.accountId?.name || "Không có tài khoản",
        date: t.date
          ? t.date.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      }));

      const context = {
        categories: categoryList,
        accounts: accountList,
        recentTransactions: transactionList,
        currentDate: new Date().toISOString().split("T")[0],
      };

      console.log("=== USER CONTEXT DETAILS ===");
      console.log("Categories sample:", categoryList.slice(0, 3));
      console.log("Accounts sample:", accountList.slice(0, 3));
      console.log("Transactions sample:", transactionList.slice(0, 2));
      console.log("=== END USER CONTEXT DETAILS ===");

      return context;
    } catch (error) {
      console.error("Error getting user context:", error);
      return {
        categories: [],
        accounts: [],
        recentTransactions: [],
        currentDate: new Date().toISOString().split("T")[0],
      };
    }
  }

  // Hàm helper để parse response từ Gemini
  parseGeminiResponse(responseText) {
    // Loại bỏ các ký tự ```json và ``` ở đầu/cuối chuỗi
    let cleanedJson = responseText.replace(/^```json\s*|```$/gm, "").trim();

    // Xử lý trường hợp có ``` ở giữa text
    cleanedJson = cleanedJson.replace(/```/g, "").trim();

    // Tìm JSON object trong text bằng cách tìm { và }
    const startIndex = cleanedJson.indexOf("{");
    const lastIndex = cleanedJson.lastIndexOf("}");

    if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
      cleanedJson = cleanedJson.substring(startIndex, lastIndex + 1);
    }

    // Xử lý các MongoDB functions không hợp lệ trong JSON
    cleanedJson = cleanedJson.replace(/ISODate\("([^"]+)"\)/g, '"$1"');
    cleanedJson = cleanedJson.replace(/ObjectId\("([^"]+)"\)/g, '"$1"');

    console.log("=== CLEANED JSON ===");
    console.log(cleanedJson);
    console.log("=== END CLEANED JSON ===");

    const parsed = JSON.parse(cleanedJson);

    // Validate required fields
    if (!parsed.intent) {
      throw new Error("Missing intent field in AI response");
    }

    // Validate entities structure
    if (!parsed.entities) {
      parsed.entities = {
        specificAccount: null,
        bankFilter: null,
        categoryFilter: null,
        timeFilter: null,
        amountFilter: null,
        searchTerm: null,
        typeFilter: null,
        statusFilter: null,
      };
    }

    return parsed;
  }

  // Lấy thống kê với filter thời gian từ entities
  async getQuickStatsWithFilter(userId, timeFilter) {
    try {
      console.log("=== GETTING STATS WITH TIME FILTER ===");
      console.log("Time filter:", timeFilter);

      let targetMonth = new Date().getMonth() + 1;
      let targetYear = new Date().getFullYear();

      // Parse timeFilter để xác định tháng/năm cụ thể
      if (timeFilter) {
        const timeInfo = this.parseTimeFilter(timeFilter);
        if (timeInfo) {
          targetMonth = timeInfo.month;
          targetYear = timeInfo.year;
        }
      }

      console.log(`Using month: ${targetMonth}, year: ${targetYear}`);
      return await this.getQuickStats(userId, targetMonth, targetYear);
    } catch (error) {
      console.error("Error getting stats with filter:", error);
      return await this.getQuickStats(userId, null, null);
    }
  }

  // Parse time filter thành month/year
  parseTimeFilter(timeFilter) {
    if (!timeFilter) return null;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const lowerFilter = timeFilter.toLowerCase();

    if (
      lowerFilter.includes("tháng này") ||
      lowerFilter.includes("this month")
    ) {
      return { month: currentMonth, year: currentYear };
    }

    if (
      lowerFilter.includes("tháng trước") ||
      lowerFilter.includes("last month")
    ) {
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      return { month: lastMonth, year: lastYear };
    }

    // Parse "tháng X"
    const monthMatch = lowerFilter.match(/tháng\s*(\d+)/);
    if (monthMatch) {
      const month = parseInt(monthMatch[1]);
      if (month >= 1 && month <= 12) {
        return { month, year: currentYear };
      }
    }

    return null;
  }

  // Lấy thống kê cơ bản
  async getQuickStats(userId, targetMonth = null, targetYear = null) {
    try {
      const userObjectId =
        typeof userId === "string"
          ? new mongoose.Types.ObjectId(userId)
          : userId;

      const now = new Date();
      const month = targetMonth || now.getMonth() + 1;
      const year = targetYear || now.getFullYear();

      // Tạo filter cho tháng hiện tại
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      console.log(`Getting stats for ${month}/${year}`);
      console.log("Date range:", startOfMonth, "to", endOfMonth);

      // Lấy giao dịch trong tháng
      const transactions = await Transaction.find({
        userId: userObjectId,
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      }).populate("categoryId", "name");

      // Tính tổng thu chi
      let totalIncome = 0;
      let totalExpense = 0;
      const categoryStats = {};

      transactions.forEach((t) => {
        if (t.type === "THUNHAP") {
          totalIncome += t.amount || 0;
        } else if (t.type === "CHITIEU") {
          totalExpense += t.amount || 0;
        }

        // Thống kê theo danh mục
        const categoryName = t.categoryId?.name || "Không có danh mục";
        if (!categoryStats[categoryName]) {
          categoryStats[categoryName] = { total: 0, count: 0, type: t.type };
        }
        categoryStats[categoryName].total += t.amount || 0;
        categoryStats[categoryName].count += 1;
      });

      const balance = totalIncome - totalExpense;
      const monthName = new Date(year, month - 1, 1).toLocaleDateString(
        "vi-VN",
        { month: "long", year: "numeric" }
      );

      // Tạo top categories
      const topCategories = Object.entries(categoryStats)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 5)
        .map(
          ([name, data]) =>
            `• ${name}: ${data.total.toLocaleString()}đ (${
              data.count
            } giao dịch)`
        )
        .join("\n");

      let responseText = `📊 <strong>Báo cáo tài chính ${monthName}:</strong>\n\n`;
      responseText += `💰 <strong>Thu nhập:</strong> ${totalIncome.toLocaleString()}đ\n`;
      responseText += `💸 <strong>Chi tiêu:</strong> ${totalExpense.toLocaleString()}đ\n`;
      responseText += `📈 <strong>Số dư:</strong> <span class="balance ${
        balance >= 0 ? "positive" : "negative"
      }">${balance.toLocaleString()}đ</span>\n`;
      responseText += `📋 <strong>Tổng giao dịch:</strong> ${transactions.length}\n\n`;

      if (topCategories) {
        responseText += `🏆 <strong>Top danh mục chi tiêu:</strong>\n${topCategories}`;
      }

      return {
        response: responseText,
        action: "CHAT_RESPONSE",
        data: {
          month,
          year,
          totalIncome,
          totalExpense,
          balance,
          transactionCount: transactions.length,
          categoryStats,
        },
      };
    } catch (error) {
      console.error("Error getting quick stats:", error);
      return {
        response: "Có lỗi xảy ra khi lấy thống kê. Vui lòng thử lại.",
        action: "CHAT_RESPONSE",
      };
    }
  }
}

module.exports = UtilsHelper;
