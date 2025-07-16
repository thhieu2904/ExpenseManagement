// backend/controllers/aiController.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const Account = require("../models/Account");
const Goal = require("../models/Goal");

// --- PHẦN NÂNG CẤP: KHỞI TẠO GEMINI ---
// Lấy API Key từ biến môi trường (.env file)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// --- KẾT THÚC PHẦN NÂNG CẤP ---

class AIController {
  // --- HÀM PROCESSMESSAGE ĐÃ ĐƯỢC NÂNG CẤP HOÀN TOÀN ---
  async processMessage(req, res) {
    try {
      const { message } = req.body;
      const userId = req.user.id;

      if (!message || typeof message !== "string") {
        return res.status(400).json({
          success: false,
          message: "Tin nhắn không hợp lệ",
        });
      }

      // Lấy dữ liệu user để cung cấp context cho AI
      const userContext = await this.getUserContext(userId);

      console.log("=== USER CONTEXT ===");
      console.log("Categories:", userContext.categories.length);
      console.log("Accounts:", userContext.accounts.length);
      console.log(
        "Recent transactions:",
        userContext.recentTransactions.length
      );
      console.log("=== END USER CONTEXT ===");

      // Xây dựng prompt với đầy đủ context
      const prompt = this.buildPrompt(message, userContext);

      // Gọi Gemini API
      const result = await model.generateContent(prompt);
      const responseText = await result.response.text();

      console.log("=== AI RAW RESPONSE ===");
      console.log(responseText);
      console.log("=== END RAW RESPONSE ===");

      // Parse kết quả JSON từ Gemini với xử lý lỗi nâng cao
      let aiResponse;
      try {
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

        aiResponse = JSON.parse(cleanedJson);

        console.log("=== PARSED AI RESPONSE ===");
        console.log(JSON.stringify(aiResponse, null, 2));
        console.log("=== END PARSED RESPONSE ===");
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Response text:", responseText);

        // Fallback response nếu không parse được
        aiResponse = {
          intent: "UNKNOWN",
          response:
            "Xin lỗi, tôi không hiểu yêu cầu của bạn. Bạn có thể nói rõ hơn không?",
          action: "CHAT_RESPONSE", // Thay đổi từ SHOW_HELP
        };
      }

      // Xử lý logic dựa trên intent Gemini trả về
      const finalResponse = await this.handleAIResponse(aiResponse, userId);

      console.log("=== FINAL RESPONSE TO CLIENT ===");
      console.log(JSON.stringify(finalResponse, null, 2));
      console.log("=== END FINAL RESPONSE ===");

      res.json({
        success: true,
        ...finalResponse,
      });
    } catch (error) {
      console.error("AI Controller Error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xử lý yêu cầu AI",
        error: error.message,
      });
    }
  }

  // --- HÀM MỚI: Xây dựng prompt cho Gemini ---
  // --- HÀM NÂNG CẤP: buildPrompt với context đầy đủ ---
  buildPrompt(userMessage, userContext) {
    const { categories, accounts, recentTransactions, currentDate } =
      userContext;

    // Tạo danh sách categories và accounts dưới dạng string
    const categoryList = categories
      .map((c) => `"${c.name}" (${c.type})`)
      .join(", ");
    const accountList = accounts
      .map(
        (a) => `"${a.name}" (${a.type}${a.bankName ? `, ${a.bankName}` : ""})`
      )
      .join(", ");

    return `
SYSTEM: Bạn là AI assistant chuyên về tài chính cá nhân. Phân tích yêu cầu người dùng và trả về JSON response chính xác.

### THÔNG TIN NGƯỜI DÙNG HIỆN TẠI
- Ngày hiện tại: ${currentDate}
- Danh mục có sẵn: ${categoryList || "Chưa có danh mục nào"}
- Tài khoản có sẵn: ${accountList || "Chưa có tài khoản nào"}
- Giao dịch gần đây: ${
      recentTransactions
        .map((t) => `${t.name} (${t.amount.toLocaleString()}đ - ${t.type})`)
        .join(", ") || "Chưa có giao dịch nào"
    }

### YÊU CẦU NGƯỜI DÙNG
"${userMessage}"

### CÁC INTENT CÓ THỂ XỬ LÝ
1. QUICK_STATS - Xem thống kê, báo cáo, tổng quan
2. ADD_TRANSACTION - Thêm giao dịch mới  
3. ADD_CATEGORY - Thêm danh mục mới
4. ADD_GOAL - Thêm mục tiêu mới
5. QUERY_TRANSACTIONS - Tìm kiếm giao dịch
6. UNKNOWN - Không xác định được

### QUY TẮC PHẢN HỒI
- Chỉ trả về JSON thuần túy, không có markdown hay giải thích
- Sử dụng đúng tên category/account có sẵn của user
- Với ADD_TRANSACTION: phải có đầy đủ name, amount, type, accountGuess, categoryGuess
- Với QUICK_STATS: KHÔNG tự tạo số liệu, chỉ nói "Tôi sẽ xem thống kê cho bạn"
- Với ADD_CATEGORY/ADD_GOAL: HỎI XÁC NHẬN, không khẳng định đã thêm
- responseForUser phải ngắn gọn, thân thiện, KHÔNG chứa số liệu cụ thể

### FORMAT JSON BẮT BUỘC
{
  "intent": "...",
  "transaction": null hoặc { "name": "...", "amount": số, "type": "CHITIEU/THUNHAP", "accountGuess": "...", "categoryGuess": "..." },
  "category": null hoặc { "name": "...", "type": "CHITIEU/THUNHAP" },
  "goal": null hoặc { "name": "...", "targetAmount": số, "deadline": "YYYY-MM-DD" },
  "responseForUser": "Câu trả lời ngắn gọn"
}

### VÍ DỤ
User: "chi 50k ăn sáng"
Response:
{
  "intent": "ADD_TRANSACTION",
  "transaction": { "name": "Ăn sáng", "amount": 50000, "type": "CHITIEU", "accountGuess": "${
    accounts[0]?.name || "Ví"
  }", "categoryGuess": "Ăn uống" },
  "category": null,
  "goal": null,
  "responseForUser": "Tôi sẽ ghi nhận chi tiêu 50,000đ cho ăn sáng."
}

User: "xem thống kê tháng này"
Response:
{
  "intent": "QUICK_STATS", 
  "transaction": null,
  "category": null,
  "goal": null,
  "responseForUser": "Để tôi xem thống kê tài chính tháng này cho bạn."
}

User: "thêm danh mục trả tiền AI"
Response:
{
  "intent": "ADD_CATEGORY",
  "transaction": null,
  "category": { "name": "Trả tiền AI", "type": "CHITIEU" },
  "goal": null,
  "responseForUser": "Bạn có muốn tôi tạo danh mục chi tiêu 'Trả tiền AI' không?"
}
    `;
  }

  // --- HÀM XỬ LÝ RESPONSE CẢI TIẾN ---
  async handleAIResponse(aiResponse, userId) {
    const { intent, transaction, category, goal, responseForUser } = aiResponse;

    switch (intent) {
      case "ADD_TRANSACTION":
        return {
          response:
            responseForUser || "Bạn có muốn tôi tạo giao dịch này không?",
          action: "CONFIRM_ADD_TRANSACTION",
          data: transaction,
        };

      case "ADD_CATEGORY":
        return {
          response: responseForUser || "Bạn có muốn tạo danh mục này không?",
          action: "CONFIRM_ADD_CATEGORY",
          data: category,
        };

      case "ADD_GOAL":
        return {
          response: responseForUser || "Bạn có muốn tạo mục tiêu này không?",
          action: "CONFIRM_ADD_GOAL",
          data: goal,
        };

      case "QUICK_STATS":
        return await this.getQuickStats(userId, responseForUser);

      case "QUERY_TRANSACTIONS":
        return {
          response: responseForUser || "Đang tìm kiếm giao dịch...",
          action: "CHAT_RESPONSE",
        };

      default:
        return {
          response:
            responseForUser ||
            "Xin lỗi, tôi chưa hiểu yêu cầu của bạn. Bạn có thể nói rõ hơn không?",
          action: "CHAT_RESPONSE",
        };
    }
  }

  // --- HÀM MỚI: Lấy context của user ---
  async getUserContext(userId) {
    try {
      // Lấy tất cả categories của user
      const categories = await Category.find({ userId });

      // Lấy tất cả accounts của user
      const accounts = await Account.find({ userId });

      // Lấy một số transaction gần đây để AI hiểu pattern
      const recentTransactions = await Transaction.find({ userId })
        .sort({ date: -1 })
        .limit(5)
        .populate("categoryId", "name type")
        .populate("accountId", "name type");

      return {
        categories: categories.map((c) => ({ name: c.name, type: c.type })),
        accounts: accounts.map((a) => ({
          name: a.name,
          type: a.type,
          balance: a.balance,
          bankName: a.bankName,
        })),
        recentTransactions: recentTransactions.map((t) => ({
          name: t.name,
          amount: t.amount,
          type: t.type,
          category: t.categoryId?.name,
          account: t.accountId?.name,
          date: t.date.toISOString().split("T")[0],
        })),
        currentDate: new Date().toISOString().split("T")[0],
      };
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

  // Lấy thống kê nhanh với custom response
  async getQuickStats(userId, customResponse = null) {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      console.log("=== QUICK STATS DEBUG ===");
      console.log("User ID:", userId);
      console.log("User ID Type:", typeof userId);
      console.log("Current Month:", currentMonth);
      console.log("Current Year:", currentYear);
      console.log("=== END DEBUG ===");

      // Convert userId to ObjectId if it's a string
      const userObjectId =
        typeof userId === "string"
          ? new mongoose.Types.ObjectId(userId)
          : userId;

      // Tính tổng thu nhập tháng này
      const monthlyIncome = await Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            type: "THUNHAP",
            $expr: {
              $and: [
                { $eq: [{ $month: "$date" }, currentMonth] },
                { $eq: [{ $year: "$date" }, currentYear] },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]);

      // Tính tổng chi tiêu tháng này
      const monthlyExpense = await Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            type: "CHITIEU",
            $expr: {
              $and: [
                { $eq: [{ $month: "$date" }, currentMonth] },
                { $eq: [{ $year: "$date" }, currentYear] },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]);

      // Tính tổng số dư từ tất cả tài khoản
      const accounts = await Account.find({ userId: userObjectId });
      const totalBalance = accounts.reduce(
        (sum, account) => sum + account.balance,
        0
      );

      const income = monthlyIncome[0]?.total || 0;
      const expense = monthlyExpense[0]?.total || 0;

      console.log("=== AGGREGATION RESULTS ===");
      console.log("Monthly Income Result:", monthlyIncome);
      console.log("Monthly Expense Result:", monthlyExpense);
      console.log("Income:", income);
      console.log("Expense:", expense);
      console.log("=== END AGGREGATION ===");

      return {
        response:
          customResponse ||
          `📊 Thống kê nhanh tháng ${currentMonth}/${currentYear}:\n• Thu nhập: ${income.toLocaleString()}đ\n• Chi tiêu: ${expense.toLocaleString()}đ\n• Số dư hiện tại: ${totalBalance.toLocaleString()}đ\n• Còn lại: ${(
            income - expense
          ).toLocaleString()}đ`,
        action: "CHAT_RESPONSE",
        data: {
          income,
          expense,
          balance: totalBalance,
          remaining: income - expense,
        },
      };
    } catch (error) {
      console.error("Error getting quick stats:", error);
      return {
        response:
          "Xin lỗi, tôi không thể lấy thống kê ngay lúc này. Vui lòng thử lại sau.",
        action: "CHAT_RESPONSE", // Cũng trả về chat response cho lỗi
      };
    }
  }

  // Thực hiện tạo giao dịch tự động
  async createTransaction(req, res) {
    try {
      const { amount, type, category, description } = req.body;
      const userId = req.user.id;

      // Convert type to proper enum value
      const transactionType = type === "expense" ? "CHITIEU" : "THUNHAP";

      // Tìm tài khoản mặc định hoặc tài khoản đầu tiên
      const account = await Account.findOne({ userId }).sort({ createdAt: 1 });
      if (!account) {
        return res.status(400).json({
          success: false,
          message: "Bạn cần có ít nhất một tài khoản để tạo giao dịch",
        });
      }

      // Tìm hoặc tạo danh mục
      let categoryDoc = await Category.findOne({
        userId,
        name: { $regex: new RegExp(category, "i") },
      });

      if (!categoryDoc && category) {
        categoryDoc = new Category({
          userId,
          name: category,
          type: transactionType,
        });
        await categoryDoc.save();
      }

      // Tạo giao dịch mới
      const transaction = new Transaction({
        userId,
        accountId: account._id,
        categoryId: categoryDoc?._id,
        name: description || `Giao dịch được tạo bởi AI Assistant`,
        amount,
        type: transactionType,
        note: description,
        date: new Date(),
      });

      await transaction.save();

      // Cập nhật số dư tài khoản
      if (transactionType === "CHITIEU") {
        account.balance -= amount;
      } else {
        account.balance += amount;
      }
      await account.save();

      res.json({
        success: true,
        message: "Giao dịch đã được tạo thành công",
        transaction,
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo giao dịch",
        error: error.message,
      });
    }
  }
}

module.exports = AIController;
