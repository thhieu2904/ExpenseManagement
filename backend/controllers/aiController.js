// backend/controllers/aiController.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
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

      // Xây dựng prompt để gửi cho Gemini
      const prompt = this.buildPrompt(message);

      // Gọi Gemini API
      const result = await model.generateContent(prompt);
      const responseText = await result.response.text();

      // Parse kết quả JSON từ Gemini
      // Loại bỏ các ký tự ```json và ``` ở đầu/cuối chuỗi
      const cleanedJson = responseText.replace(/^```json\s*|```$/g, "").trim();
      const aiResponse = JSON.parse(cleanedJson);

      // Xử lý logic dựa trên intent Gemini trả về
      const finalResponse = await this.handleAIResponse(aiResponse, userId);

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
  buildPrompt(userMessage) {
    // Ngày hiện tại để cung cấp ngữ cảnh thời gian cho AI
    const currentDate = new Date().toLocaleDateString("vi-VN");

    // Đây là phần "bộ não" quan trọng nhất.
    // Chúng ta cung cấp toàn bộ cấu trúc dữ liệu để Gemini hiểu và trả về đúng định dạng.
    return `
      Bạn là một trợ lý tài chính thông minh cho một ứng dụng quản lý chi tiêu. 
      Nhiệm vụ của bạn là phân tích yêu cầu của người dùng và chuyển đổi nó thành một đối tượng JSON có cấu trúc.
      Hôm nay là ngày ${currentDate}.

      Dưới đây là cấu trúc cơ sở dữ liệu (Mongoose Schemas) của ứng dụng:
      1. Transaction: { name: String, amount: Number, type: Enum['THUNHAP', 'CHITIEU'], date: Date, note: String, accountId: ObjectId, categoryId: ObjectId }
      2. Account: { name: String, type: Enum['TIENMAT', 'THENGANHANG'], bankName: String }
      3. Category: { name: String, type: Enum['THUNHAP', 'CHITIEU'] }
      4. Goal: { name: String, targetAmount: Number, deadline: Date }

      Dựa vào yêu cầu của người dùng, hãy xác định ý định (intent) và trích xuất các thông tin liên quan.

      Các loại intent có thể có:
      - 'ADD_TRANSACTION': Khi người dùng muốn thêm giao dịch mới.
      - 'QUERY_TRANSACTIONS': Khi người dùng muốn xem, tìm kiếm, liệt kê hoặc hỏi về các giao dịch.
      - 'ADD_GOAL': Khi người dùng muốn tạo mục tiêu tiết kiệm mới.
      - 'QUICK_STATS': Khi người dùng hỏi về tổng quan tài chính (tổng thu, tổng chi, số dư).
      - 'UNKNOWN': Nếu không xác định được ý định.

      Yêu cầu của người dùng: "${userMessage}"

      Hãy trả về một đối tượng JSON duy nhất với định dạng sau. 
      Đối với các trường không có thông tin, hãy để giá trị là null.
      {
        "intent": "...",
        "transaction": {
          "name": "...",
          "amount": ...,
          "type": "...",
          "date": "...",
          "note": "...",
          "accountGuess": "tên tài khoản người dùng có thể đã nhắc tới, ví dụ: 'thẻ techcombank', 'ví'",
          "categoryGuess": "tên danh mục người dùng có thể đã nhắc tới, ví dụ: 'ăn uống', 'xăng xe'"
        },
        "goal": {
          "name": "...",
          "targetAmount": ...,
          "deadline": "..."
        },
        "query": {
          "text": "Mô tả lại câu hỏi truy vấn của người dùng",
          "mongoFilter": "Tạo một object filter cho MongoDB dựa trên câu hỏi, ví dụ: { 'amount': { '$gt': 50000 } }",
          "dateRange": { "start": "...", "end": "..." }
        },
        "response": "Một câu trả lời tự nhiên cho người dùng, xác nhận lại yêu cầu."
      }

      Ví dụ: Nếu người dùng nói "Thêm chi tiêu 50k ăn sáng bằng ví", bạn nên trả về:
      {
        "intent": "ADD_TRANSACTION",
        "transaction": { "name": "Ăn sáng", "amount": 50000, "type": "CHITIEU", "date": "${
          new Date().toISOString().split("T")[0]
        }", "note": null, "accountGuess": "ví", "categoryGuess": "ăn uống" },
        "goal": null,
        "query": null,
        "response": "Tôi đã hiểu, bạn muốn thêm giao dịch chi tiêu 50,000đ cho việc ăn sáng từ tài khoản ví của bạn, phải không?"
      }
      
      Chỉ trả về đối tượng JSON, không có bất kỳ giải thích nào khác.
    `;
  }

  // --- HÀM MỚI: Xử lý phản hồi từ AI ---
  async handleAIResponse(aiResponse, userId) {
    const { intent, transaction, goal, query, response } = aiResponse;

    switch (intent) {
      case "ADD_TRANSACTION":
        // Logic để chuẩn bị tạo giao dịch
        // Bạn có thể lưu thông tin này vào session hoặc trả về để frontend xác nhận
        return {
          response: response || "Bạn có muốn tôi tạo giao dịch này không?",
          action: "CONFIRM_ADD_TRANSACTION",
          data: transaction, // Gửi dữ liệu đã được phân tích cho frontend
        };

      case "QUICK_STATS":
        return await this.getQuickStats(userId);

      // Thêm các case khác cho QUERY_TRANSACTIONS, ADD_GOAL...

      default:
        return {
          response:
            response ||
            "Xin lỗi, tôi chưa hiểu yêu cầu của bạn. Bạn có thể nói rõ hơn không?",
          action: "SHOW_HELP",
        };
    }
  }

  // Lấy thống kê nhanh
  async getQuickStats(userId) {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Tính tổng thu nhập tháng này
      const monthlyIncome = await Transaction.aggregate([
        {
          $match: {
            userId: userId,
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
            userId: userId,
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
      const accounts = await Account.find({ userId });
      const totalBalance = accounts.reduce(
        (sum, account) => sum + account.balance,
        0
      );

      const income = monthlyIncome[0]?.total || 0;
      const expense = monthlyExpense[0]?.total || 0;

      return {
        response: `📊 Thống kê nhanh tháng ${currentMonth}/${currentYear}:\n• Thu nhập: ${income.toLocaleString()}đ\n• Chi tiêu: ${expense.toLocaleString()}đ\n• Số dư hiện tại: ${totalBalance.toLocaleString()}đ\n• Còn lại: ${(
          income - expense
        ).toLocaleString()}đ`,
        action: "SHOW_STATS",
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
        action: "ERROR",
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

module.exports = new AIController();
