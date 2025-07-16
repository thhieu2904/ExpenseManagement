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
  constructor() {
    // Lưu trạng thái conversation theo userId
    this.conversationStates = new Map();
  }

  // Lấy conversation state của user
  getConversationState(userId) {
    if (!this.conversationStates.has(userId)) {
      this.conversationStates.set(userId, {
        waitingFor: null, // 'goal_amount', 'goal_deadline', 'transaction_amount', etc.
        pendingData: {}, // Dữ liệu đang chờ hoàn thiện
        lastIntent: null,
        conversationHistory: [],
      });
    }
    return this.conversationStates.get(userId);
  }

  // Cập nhật conversation state
  updateConversationState(userId, updates) {
    const state = this.getConversationState(userId);
    Object.assign(state, updates);
    this.conversationStates.set(userId, state);
  }

  // Reset conversation state
  resetConversationState(userId) {
    this.conversationStates.delete(userId);
  }

  // --- HÀM PROCESSMESSAGE ĐÃ ĐƯỢC NÂNG CẤP HOÀN TOÀN ---
  async processMessage(req, res) {
    try {
      console.log("=== STARTING AI PROCESS MESSAGE ===");
      console.log("Request body:", req.body);
      console.log("User ID:", req.user?.id);

      const { message } = req.body;
      const userId = req.user.id;

      // Validate input
      if (
        !message ||
        typeof message !== "string" ||
        message.trim().length === 0
      ) {
        console.log("Invalid message:", message);
        return res.status(400).json({
          success: false,
          message: "Tin nhắn không hợp lệ hoặc rỗng",
        });
      }

      if (!userId) {
        console.log("User ID not found");
        return res.status(401).json({
          success: false,
          message: "Người dùng chưa đăng nhập",
        });
      }

      // Check API key
      if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY not found in environment variables");
        return res.status(500).json({
          success: false,
          message: "Dịch vụ AI chưa được cấu hình",
        });
      }

      console.log("Getting user context for userId:", userId);

      // Lấy conversation state
      const conversationState = this.getConversationState(userId);
      console.log("=== CONVERSATION STATE ===");
      console.log("Waiting for:", conversationState.waitingFor);
      console.log("Pending data:", conversationState.pendingData);
      console.log("Last intent:", conversationState.lastIntent);
      console.log("=== END CONVERSATION STATE ===");

      // Kiểm tra nếu đang chờ thông tin bổ sung
      if (conversationState.waitingFor) {
        console.log("Handling follow-up response...");
        const followUpResult = await this.handleFollowUpResponse(
          message.trim(),
          userId,
          conversationState
        );
        return res.json({
          success: true,
          ...followUpResult,
        });
      }

      // Kiểm tra local patterns trước khi gọi Gemini API
      const localResponse = await this.tryLocalProcessing(
        message.trim(),
        userId
      );
      if (localResponse) {
        console.log("Handled locally without Gemini API");
        return res.json({
          success: true,
          ...localResponse,
        });
      }

      // Lấy dữ liệu user để cung cấp context cho AI
      const userContext = await this.getUserContext(userId);

      console.log("=== USER CONTEXT SUMMARY ===");
      console.log("Categories:", userContext.categories.length);
      console.log("Accounts:", userContext.accounts.length);
      console.log(
        "Recent transactions:",
        userContext.recentTransactions.length
      );
      console.log("=== END USER CONTEXT SUMMARY ===");

      // Xây dựng prompt với đầy đủ context
      console.log("Building prompt...");
      const prompt = this.buildPrompt(message.trim(), userContext);

      console.log("=== CALLING GEMINI API ===");
      console.log("Prompt length:", prompt.length);
      console.log("=== END CALLING GEMINI API ===");

      // Gọi Gemini API với timeout và retry mechanism
      const result = await this.callGeminiWithRetry(prompt, 3);

      const responseText = await result.response.text();

      console.log("=== GEMINI RAW RESPONSE ===");
      console.log("Response length:", responseText.length);
      console.log(
        "Response content (first 500 chars):",
        responseText.substring(0, 500)
      );
      console.log("=== END GEMINI RAW RESPONSE ===");

      // Parse kết quả JSON từ Gemini với xử lý lỗi nâng cao
      let aiResponse;
      try {
        aiResponse = this.parseGeminiResponse(responseText);
        console.log("=== PARSED AI RESPONSE ===");
        console.log(JSON.stringify(aiResponse, null, 2));
        console.log("=== END PARSED RESPONSE ===");
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Response text:", responseText);

        // Fallback response nếu không parse được
        aiResponse = {
          intent: "UNKNOWN",
          responseForUser:
            "Xin lỗi, tôi không hiểu yêu cầu của bạn. Bạn có thể nói rõ hơn không?",
          transaction: null,
          category: null,
          goal: null,
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

      // Differentiate error types
      let errorMessage = "Lỗi server khi xử lý yêu cầu AI";
      let statusCode = 500;

      if (error.message === "Gemini API timeout") {
        errorMessage = "Dịch vụ AI đang quá tải, vui lòng thử lại sau";
        statusCode = 503;
      } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        errorMessage = "Không thể kết nối đến dịch vụ AI";
        statusCode = 503;
      } else if (
        error.status === 503 ||
        error.statusText === "Service Unavailable"
      ) {
        errorMessage = "Dịch vụ AI hiện đang quá tải, vui lòng thử lại sau";
        statusCode = 503;

        // Thử xử lý local fallback cho một số patterns phổ biến
        try {
          const fallbackResponse = await this.handleFallbackResponse(
            req.body.message,
            req.user.id
          );
          if (fallbackResponse) {
            return res.json({
              success: true,
              ...fallbackResponse,
            });
          }
        } catch (fallbackError) {
          console.error("Fallback error:", fallbackError);
        }
      } else if (
        error.status === 429 ||
        error.message.includes("quota") ||
        error.message.includes("Too Many Requests")
      ) {
        errorMessage = "Hạn mức API đã hết, đang sử dụng xử lý offline";
        statusCode = 503;

        // Thử xử lý local fallback cho lỗi quota
        try {
          const fallbackResponse = await this.handleFallbackResponse(
            req.body.message,
            req.user.id
          );
          if (fallbackResponse) {
            return res.json({
              success: true,
              ...fallbackResponse,
            });
          }
        } catch (fallbackError) {
          console.error("Fallback error:", fallbackError);
        }
      }

      res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
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

    return parsed;
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

### XỬ LÝ THỜI GIAN CHO MỤC TIÊU
- Hiểu các cụm từ: "tháng 1 năm 2026", "tháng 1 năm sau", "cuối năm", "đầu năm sau"
- Format deadline: "YYYY-MM-DD" (ví dụ: "2026-01-31" cho "tháng 1 năm 2026")
- Năm hiện tại: ${new Date().getFullYear()}
- Mặc định: nếu không có năm thì là năm hiện tại, nếu nói "năm sau/tới" thì +1 năm
- "cuối năm" = "31/12/năm", "đầu năm" = "31/01/năm", "tháng X" = "ngày cuối tháng X"

### VÍ DỤ XỬ LÝ THỜI GIAN
- "tháng 1 năm 2026" → deadline: "2026-01-31"
- "tháng 1 năm sau" → deadline: "${new Date().getFullYear() + 1}-01-31"
- "cuối năm" → deadline: "${new Date().getFullYear()}-12-31"
- "tháng 6" → deadline: "${new Date().getFullYear()}-06-30"

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

User: "tạo mục tiêu tiết kiệm 5 triệu đi sapa tháng 1 năm 2026"
Response:
{
  "intent": "ADD_GOAL",
  "transaction": null,
  "category": null,
  "goal": { "name": "Đi Sapa", "targetAmount": 5000000, "deadline": "2026-01-31" },
  "responseForUser": "Bạn có muốn tạo mục tiêu tiết kiệm 5.000.000đ cho chuyến đi Sapa với hạn cuối tháng 1 năm 2026 không?"
}

User: "mục tiêu mua nhà 2 tỷ cuối năm"
Response:
{
  "intent": "ADD_GOAL",
  "transaction": null,
  "category": null,
  "goal": { "name": "Mua nhà", "targetAmount": 2000000000, "deadline": "${new Date().getFullYear()}-12-31" },
  "responseForUser": "Bạn có muốn tạo mục tiêu tiết kiệm 2.000.000.000đ để mua nhà với hạn cuối năm nay không?"
}
    `;
  }

  // --- HÀM XỬ LÝ RESPONSE CẢI TIẾN ---
  async handleAIResponse(aiResponse, userId) {
    const { intent, transaction, category, goal, responseForUser } = aiResponse;

    console.log("=== HANDLING AI RESPONSE ===");
    console.log("Intent:", intent);
    console.log("Transaction data:", transaction);
    console.log("Category data:", category);
    console.log("Goal data:", goal);

    switch (intent) {
      case "ADD_TRANSACTION":
        return await this.handleAddTransaction(
          transaction,
          userId,
          responseForUser
        );

      case "ADD_CATEGORY":
        return await this.handleAddCategory(category, userId, responseForUser);

      case "ADD_GOAL":
        return await this.handleAddGoal(goal, userId, responseForUser);

      case "QUICK_STATS":
        // For QUICK_STATS from Gemini, use current month
        return await this.getQuickStats(userId, null, null);

      case "QUERY_TRANSACTIONS":
        return await this.handleQueryTransactions(userId, responseForUser);

      default:
        return {
          response:
            responseForUser ||
            "Xin lỗi, tôi chưa hiểu yêu cầu của bạn. Bạn có thể nói rõ hơn không?",
          action: "CHAT_RESPONSE",
        };
    }
  }

  // Xử lý thêm giao dịch
  async handleAddTransaction(transaction, userId, responseForUser) {
    try {
      // Kiểm tra nếu transaction thiếu thông tin
      if (!transaction || !transaction.amount || transaction.amount === null) {
        // Set conversation state để hỏi số tiền
        this.updateConversationState(userId, {
          waitingFor: "transaction_amount",
          pendingData: {
            name: transaction?.name || "Giao dịch mới",
            type: transaction?.type || "CHITIEU",
            accountGuess: transaction?.accountGuess,
            categoryGuess: transaction?.categoryGuess,
          },
          lastIntent: "ADD_TRANSACTION",
        });

        return {
          response:
            responseForUser ||
            `Bạn ${transaction?.type === "CHITIEU" ? "chi" : "thu"} "${
              transaction?.name || "giao dịch"
            }" hết bao nhiêu tiền?`,
          action: "CHAT_RESPONSE",
        };
      }

      // Validate required fields
      if (!transaction.name || !transaction.type) {
        return {
          response: "Thông tin giao dịch không đầy đủ. Vui lòng thử lại.",
          action: "CHAT_RESPONSE",
        };
      }

      return {
        response:
          responseForUser ||
          `Xác nhận thêm giao dịch:\n• Tên: ${
            transaction.name
          }\n• Số tiền: ${Number(
            transaction.amount
          ).toLocaleString()}đ\n• Loại: ${
            transaction.type === "CHITIEU" ? "Chi tiêu" : "Thu nhập"
          }\n• Danh mục: ${transaction.categoryGuess || "Không xác định"}`,
        action: "CONFIRM_ADD_TRANSACTION",
        data: {
          name: transaction.name,
          amount: Number(transaction.amount),
          type: transaction.type,
          categoryGuess: transaction.categoryGuess,
          accountGuess: transaction.accountGuess,
        },
      };
    } catch (error) {
      console.error("Error handling add transaction:", error);
      return {
        response:
          "Có lỗi xảy ra khi xử lý thông tin giao dịch. Vui lòng thử lại.",
        action: "CHAT_RESPONSE",
      };
    }
  }

  // Xử lý thêm danh mục
  async handleAddCategory(category, userId, responseForUser) {
    try {
      if (!category || !category.name || !category.type) {
        return {
          response: "Thông tin danh mục không đầy đủ. Vui lòng thử lại.",
          action: "CHAT_RESPONSE",
        };
      }

      return {
        response:
          responseForUser ||
          `Xác nhận tạo danh mục:\n• Tên: ${category.name}\n• Loại: ${
            category.type === "CHITIEU" ? "Chi tiêu" : "Thu nhập"
          }`,
        action: "CONFIRM_ADD_CATEGORY",
        data: {
          name: category.name,
          type: category.type,
          icon: category.icon || "fa-question-circle",
        },
      };
    } catch (error) {
      console.error("Error handling add category:", error);
      return {
        response:
          "Có lỗi xảy ra khi xử lý thông tin danh mục. Vui lòng thử lại.",
        action: "CHAT_RESPONSE",
      };
    }
  }

  // Xử lý thêm mục tiêu
  async handleAddGoal(goal, userId, responseForUser) {
    try {
      if (!goal || !goal.name) {
        return {
          response: "Tên mục tiêu không được để trống. Vui lòng thử lại.",
          action: "CHAT_RESPONSE",
        };
      }

      // Kiểm tra nếu goal thiếu số tiền
      if (!goal.targetAmount || goal.targetAmount === null) {
        this.updateConversationState(userId, {
          waitingFor: "goal_amount",
          pendingData: {
            name: goal.name,
            deadline: goal.deadline,
          },
          lastIntent: "ADD_GOAL",
        });

        return {
          response:
            responseForUser ||
            `Bạn muốn đặt mục tiêu chi tiêu bao nhiêu cho "${goal.name}"? Ví dụ: "5 triệu" hoặc "5000000đ"`,
          action: "CHAT_RESPONSE",
        };
      }

      // Kiểm tra nếu goal thiếu deadline
      if (!goal.deadline || goal.deadline === null) {
        this.updateConversationState(userId, {
          waitingFor: "goal_deadline",
          pendingData: {
            name: goal.name,
            targetAmount: goal.targetAmount,
          },
          lastIntent: "ADD_GOAL",
        });

        return {
          response:
            responseForUser ||
            `Mục tiêu ${Number(goal.targetAmount).toLocaleString()}đ cho "${
              goal.name
            }". Bạn muốn hoàn thành vào lúc nào?`,
          action: "CHAT_RESPONSE",
        };
      }

      // Nếu có đầy đủ thông tin thì confirm
      return {
        response:
          responseForUser ||
          `Xác nhận tạo mục tiêu:\n• Tên: ${
            goal.name
          }\n• Số tiền mục tiêu: ${Number(
            goal.targetAmount
          ).toLocaleString()}đ\n• Hạn: ${goal.deadline}`,
        action: "CONFIRM_ADD_GOAL",
        data: {
          name: goal.name,
          targetAmount: Number(goal.targetAmount),
          deadline: goal.deadline,
          icon: goal.icon || "fa-bullseye",
        },
      };
    } catch (error) {
      console.error("Error handling add goal:", error);
      return {
        response:
          "Có lỗi xảy ra khi xử lý thông tin mục tiêu. Vui lòng thử lại.",
        action: "CHAT_RESPONSE",
      };
    }
  }

  // Xử lý tìm kiếm giao dịch
  async handleQueryTransactions(userId, responseForUser) {
    try {
      // Có thể mở rộng logic tìm kiếm ở đây
      return {
        response:
          responseForUser ||
          "Tính năng tìm kiếm giao dịch đang được phát triển.",
        action: "CHAT_RESPONSE",
      };
    } catch (error) {
      console.error("Error handling query transactions:", error);
      return {
        response: "Có lỗi xảy ra khi tìm kiếm giao dịch. Vui lòng thử lại.",
        action: "CHAT_RESPONSE",
      };
    }
  }

  // --- HÀM MỚI: Lấy context của user - CẢI TIẾN ---
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

  // Lấy thống kê nhanh từ API thống kê thực tế
  async getQuickStats(userId, targetMonth = null, targetYear = null) {
    try {
      const currentMonth = targetMonth || new Date().getMonth() + 1;
      const currentYear = targetYear || new Date().getFullYear();

      console.log(
        `=== GETTING STATS FOR MONTH ${currentMonth}/${currentYear} ===`
      );

      // Convert userId to ObjectId if it's a string
      const userObjectId =
        typeof userId === "string"
          ? new mongoose.Types.ObjectId(userId)
          : userId;

      // Tính ngày đầu và cuối tháng được chỉ định
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
      const endOfMonth = new Date(
        currentYear,
        currentMonth,
        0,
        23,
        59,
        59,
        999
      );

      console.log("Date range:", startOfMonth, "to", endOfMonth);

      // Gọi API thống kê summary với đúng format
      const statsController = require("./statisticsController");

      let summaryData = {};

      // Tạo mock req/res để gọi getSummaryStats
      const mockReq = {
        user: { id: userId },
        query: {
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
        },
      };

      const mockRes = {
        status: (code) => mockRes,
        json: (data) => {
          summaryData = data;
        },
      };

      await statsController.getSummaryStats(mockReq, mockRes);

      // Tính số dư tài khoản từ initialBalance + tổng giao dịch
      const accounts = await Account.find({ userId: userObjectId });
      const Transaction = require("../models/Transaction");

      console.log("=== ACCOUNT BALANCE DEBUG ===");
      console.log("Found accounts:", accounts.length);

      let totalBalance = 0;

      for (const account of accounts) {
        // Lấy initialBalance
        const initialBalance = account.initialBalance || 0;

        // Tính tổng giao dịch của account này
        const transactions = await Transaction.find({
          userId: userObjectId,
          accountId: account._id,
        });

        const accountTransactionSum = transactions.reduce(
          (sum, transaction) => {
            if (transaction.type === "THUNHAP") {
              return sum + (transaction.amount || 0);
            } else if (transaction.type === "CHITIEU") {
              return sum - (transaction.amount || 0);
            }
            return sum;
          },
          0
        );

        const accountBalance = initialBalance + accountTransactionSum;

        console.log(
          `Account: ${account.name}, Initial: ${initialBalance}, Transactions: ${accountTransactionSum}, Balance: ${accountBalance}`
        );

        totalBalance += accountBalance;
      }

      console.log("Total balance calculated:", totalBalance);
      console.log("=== END ACCOUNT BALANCE DEBUG ===");

      const income = summaryData.totalIncome || 0;
      const expense = summaryData.totalExpense || 0;
      const remaining = summaryData.cashFlow || income - expense;

      // Cải thiện format response với HTML-like format cho frontend
      const responseText = [
        `📊 <strong>Thống kê tháng ${currentMonth}/${currentYear}:</strong>`,
        `💰 Thu nhập: <span class="income">${income.toLocaleString()}đ</span>`,
        `💸 Chi tiêu: <span class="expense">${expense.toLocaleString()}đ</span>`,
        `🏦 Số dư: <span class="balance">${totalBalance.toLocaleString()}đ</span>`,
        `📈 Còn lại: <span class="remaining ${
          remaining >= 0 ? "positive" : "negative"
        }">${remaining.toLocaleString()}đ</span>`,
        "",
        remaining >= 0
          ? "✅ <em>Tháng này bạn đã tiết kiệm được tiền!</em>"
          : "⚠️ <em>Tháng này bạn đã chi tiêu vượt thu nhập.</em>",
      ].join("\n");

      return {
        response: responseText,
        action: "CHAT_RESPONSE",
        data: {
          income,
          expense,
          balance: totalBalance,
          remaining,
          cashFlow: remaining,
          month: currentMonth,
          year: currentYear,
          // Thêm thông tin chi tiết để frontend có thể format đẹp hơn
          formatted: {
            income: income.toLocaleString(),
            expense: expense.toLocaleString(),
            balance: totalBalance.toLocaleString(),
            remaining: remaining.toLocaleString(),
            isPositive: remaining >= 0,
          },
        },
      };
    } catch (error) {
      console.error("Error getting quick stats:", error);
      return {
        response:
          "Xin lỗi, tôi không thể lấy thống kê ngay lúc này. Vui lòng thử lại sau.",
        action: "CHAT_RESPONSE",
      };
    }
  }

  // Thực hiện tạo giao dịch tự động - sử dụng trực tiếp transactionController
  async createTransaction(req, res) {
    try {
      console.log("=== AI CREATE TRANSACTION ===");
      console.log("Request body:", req.body);

      const { amount, type, name, description, accountGuess, categoryGuess } =
        req.body;
      const userId = req.user.id;

      // Convert type to proper enum value
      const transactionType = type === "expense" ? "CHITIEU" : "THUNHAP";
      const transactionName =
        name || description || "Giao dịch được tạo bởi AI Assistant";

      // Tìm tài khoản theo accountGuess hoặc lấy tài khoản đầu tiên
      let account;
      if (accountGuess) {
        account = await Account.findOne({
          userId,
          name: { $regex: new RegExp(accountGuess, "i") },
        });
      }

      if (!account) {
        account = await Account.findOne({ userId }).sort({ createdAt: 1 });
      }

      if (!account) {
        return res.status(400).json({
          success: false,
          message: "Bạn cần có ít nhất một tài khoản để tạo giao dịch",
        });
      }

      // Tìm hoặc tạo danh mục
      let categoryDoc;
      const searchCategory = categoryGuess;

      if (searchCategory) {
        categoryDoc = await Category.findOne({
          userId,
          name: { $regex: new RegExp(searchCategory, "i") },
          type: transactionType,
        });

        if (!categoryDoc) {
          console.log(
            `Creating new category: ${searchCategory} - ${transactionType}`
          );
          categoryDoc = new Category({
            userId,
            name: searchCategory,
            type: transactionType,
            icon: "fa-question-circle",
          });
          await categoryDoc.save();
        }
      }

      if (!categoryDoc) {
        // Tìm danh mục mặc định
        categoryDoc = await Category.findOne({
          userId,
          type: transactionType,
        });

        if (!categoryDoc) {
          // Tạo danh mục mặc định
          categoryDoc = new Category({
            userId,
            name:
              transactionType === "CHITIEU" ? "Chi tiêu khác" : "Thu nhập khác",
            type: transactionType,
            icon: "fa-question-circle",
          });
          await categoryDoc.save();
        }
      }

      // Tạo request body chuẩn cho transactionController
      const transactionData = {
        name: transactionName,
        amount: Math.round(Number(amount)),
        type: transactionType,
        categoryId: categoryDoc._id,
        accountId: account._id,
        date: new Date(),
        note: description || transactionName,
      };

      console.log("Transaction data to create:", transactionData);

      // Sử dụng trực tiếp transactionController
      const transactionController = require("./transactionController");

      // Tạo req/res giống như API call thực
      const transactionReq = {
        user: { id: userId },
        body: transactionData,
      };

      // Tạo promise để capture response từ transactionController
      const transactionResult = await new Promise((resolve, reject) => {
        const mockRes = {
          status: (code) => {
            mockRes.statusCode = code;
            return mockRes;
          },
          json: (data) => {
            if (mockRes.statusCode === 201) {
              resolve({ success: true, transaction: data });
            } else {
              reject(new Error(data.error || "Transaction creation failed"));
            }
          },
        };

        transactionController
          .createTransaction(transactionReq, mockRes)
          .catch(reject);
      });

      console.log(
        "Transaction created successfully:",
        transactionResult.transaction
      );

      res.json({
        success: true,
        message: "Giao dịch đã được tạo thành công",
        transaction: transactionResult.transaction,
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

  // Thực hiện tạo danh mục tự động - sử dụng trực tiếp categoryController
  async createCategory(req, res) {
    try {
      console.log("=== AI CREATE CATEGORY ===");
      console.log("Request body:", req.body);

      const { name, type, icon } = req.body;
      const userId = req.user.id;

      if (!name || !type) {
        return res.status(400).json({
          success: false,
          message: "Thiếu tên hoặc loại danh mục",
        });
      }

      // Sử dụng trực tiếp categoryController
      const categoryController = require("./categoryController");

      // Tạo request data chuẩn cho categoryController
      const categoryReq = {
        user: { id: userId },
        body: {
          name,
          type,
          icon: icon || "fa-question-circle",
        },
      };

      // Tạo promise để capture response từ categoryController
      const categoryResult = await new Promise((resolve, reject) => {
        const mockRes = {
          status: (code) => {
            mockRes.statusCode = code;
            return mockRes;
          },
          json: (data) => {
            if (mockRes.statusCode === 201) {
              resolve({ success: true, category: data });
            } else {
              reject(new Error(data.error || "Category creation failed"));
            }
          },
        };

        categoryController.createCategory(categoryReq, mockRes).catch(reject);
      });

      console.log("Category created successfully:", categoryResult.category);

      res.json({
        success: true,
        message: "Danh mục đã được tạo thành công",
        category: categoryResult.category,
      });
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo danh mục",
        error: error.message,
      });
    }
  }

  // Thực hiện tạo mục tiêu tự động - sử dụng trực tiếp goalController
  async createGoal(req, res) {
    try {
      console.log("=== AI CREATE GOAL ===");
      console.log("Request body:", req.body);

      const { name, targetAmount, deadline, icon } = req.body;
      const userId = req.user.id;

      if (!name || !targetAmount) {
        return res.status(400).json({
          success: false,
          message: "Tên và số tiền mục tiêu là bắt buộc",
        });
      }

      // Convert deadline format if needed (DD/MM/YYYY to YYYY-MM-DD)
      let formattedDeadline = deadline;
      if (deadline && deadline.includes("/")) {
        const parts = deadline.split("/");
        if (parts.length === 3) {
          formattedDeadline = `${parts[2]}-${parts[1].padStart(
            2,
            "0"
          )}-${parts[0].padStart(2, "0")}`;
        }
      }

      // Sử dụng trực tiếp goalController
      const goalController = require("./goalController");

      // Tạo request data chuẩn cho goalController
      const goalReq = {
        user: { id: userId },
        body: {
          name,
          targetAmount: Number(targetAmount),
          deadline: formattedDeadline,
          icon: icon || "fa-bullseye",
        },
      };

      // Tạo promise để capture response từ goalController
      const goalResult = await new Promise((resolve, reject) => {
        const mockRes = {
          status: (code) => {
            mockRes.statusCode = code;
            return mockRes;
          },
          json: (data) => {
            if (mockRes.statusCode === 201) {
              resolve({ success: true, goal: data });
            } else {
              reject(new Error(data.error || "Goal creation failed"));
            }
          },
        };

        goalController.createGoal(goalReq, mockRes).catch(reject);
      });

      console.log("Goal created successfully:", goalResult.goal);

      res.json({
        success: true,
        message: "Mục tiêu đã được tạo thành công",
        goal: goalResult.goal,
      });
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo mục tiêu",
        error: error.message,
      });
    }
  }

  // Lấy danh sách giao dịch gần đây
  async getRecentTransactions(userId) {
    try {
      const userObjectId =
        typeof userId === "string"
          ? new mongoose.Types.ObjectId(userId)
          : userId;

      const transactions = await Transaction.find({ userId: userObjectId })
        .sort({ date: -1 })
        .limit(10)
        .populate("categoryId", "name type")
        .populate("accountId", "name type");

      if (transactions.length === 0) {
        return {
          response: "Bạn chưa có giao dịch nào.",
          action: "CHAT_RESPONSE",
        };
      }

      const transactionList = transactions
        .map(
          (t, index) =>
            `${index + 1}. <strong>${
              t.name
            }</strong> - <span class="${t.type.toLowerCase()}">${t.amount.toLocaleString()}đ</span> (${
              t.categoryId?.name || "Không có danh mục"
            }) - ${new Date(t.date).toLocaleDateString("vi-VN")}`
        )
        .join("\n");

      return {
        response: `📋 <strong>10 giao dịch gần đây:</strong>\n\n${transactionList}`,
        action: "CHAT_RESPONSE",
        data: {
          transactions: transactions.map((t) => ({
            id: t._id,
            name: t.name,
            amount: t.amount,
            type: t.type,
            category: t.categoryId?.name,
            account: t.accountId?.name,
            date: t.date,
          })),
        },
      };
    } catch (error) {
      console.error("Error getting recent transactions:", error);
      return {
        response: "Có lỗi xảy ra khi lấy danh sách giao dịch.",
        action: "CHAT_RESPONSE",
      };
    }
  }

  // Lấy danh sách tài khoản
  async getAccountList(userId) {
    try {
      const userObjectId =
        typeof userId === "string"
          ? new mongoose.Types.ObjectId(userId)
          : userId;

      const accounts = await Account.find({ userId: userObjectId });

      if (accounts.length === 0) {
        return {
          response: "Bạn chưa có tài khoản nào.",
          action: "CHAT_RESPONSE",
        };
      }

      const accountList = accounts
        .map((acc, index) => {
          const typeText =
            acc.type === "TIENMAT" ? "💵 Tiền mặt" : "🏦 Ngân hàng";
          const bankInfo = acc.bankName ? ` (${acc.bankName})` : "";
          return `${index + 1}. <strong>${
            acc.name
          }</strong> ${typeText}${bankInfo} - <span class="balance">${acc.balance.toLocaleString()}đ</span>`;
        })
        .join("\n");

      const totalBalance = accounts.reduce(
        (sum, acc) => sum + (acc.balance || 0),
        0
      );

      return {
        response: `💼 <strong>Danh sách tài khoản:</strong>\n\n${accountList}\n\n<strong>Tổng số dư: ${totalBalance.toLocaleString()}đ</strong>`,
        action: "CHAT_RESPONSE",
        data: {
          accounts: accounts.map((acc) => ({
            id: acc._id,
            name: acc.name,
            type: acc.type,
            balance: acc.balance,
            bankName: acc.bankName,
          })),
          totalBalance,
        },
      };
    } catch (error) {
      console.error("Error getting account list:", error);
      return {
        response: "Có lỗi xảy ra khi lấy danh sách tài khoản.",
        action: "CHAT_RESPONSE",
      };
    }
  }

  // Lấy danh sách danh mục
  async getCategoryList(userId) {
    try {
      const userObjectId =
        typeof userId === "string"
          ? new mongoose.Types.ObjectId(userId)
          : userId;

      const categories = await Category.find({ userId: userObjectId }).sort({
        type: 1,
        name: 1,
      });

      if (categories.length === 0) {
        return {
          response: "Bạn chưa có danh mục nào.",
          action: "CHAT_RESPONSE",
        };
      }

      const incomeCategories = categories.filter((c) => c.type === "THUNHAP");
      const expenseCategories = categories.filter((c) => c.type === "CHITIEU");

      let responseText = "📂 <strong>Danh sách danh mục:</strong>\n\n";

      if (incomeCategories.length > 0) {
        responseText += "💰 <strong>Thu nhập:</strong>\n";
        responseText += incomeCategories
          .map((cat, index) => `${index + 1}. ${cat.name}`)
          .join("\n");
        responseText += "\n\n";
      }

      if (expenseCategories.length > 0) {
        responseText += "💸 <strong>Chi tiêu:</strong>\n";
        responseText += expenseCategories
          .map((cat, index) => `${index + 1}. ${cat.name}`)
          .join("\n");
      }

      return {
        response: responseText.trim(),
        action: "CHAT_RESPONSE",
        data: {
          categories: categories.map((cat) => ({
            id: cat._id,
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
          })),
          summary: {
            total: categories.length,
            income: incomeCategories.length,
            expense: expenseCategories.length,
          },
        },
      };
    } catch (error) {
      console.error("Error getting category list:", error);
      return {
        response: "Có lỗi xảy ra khi lấy danh sách danh mục.",
        action: "CHAT_RESPONSE",
      };
    }
  }

  // Lấy danh sách mục tiêu
  async getGoalList(userId) {
    try {
      const goals = await Goal.find({ user: userId, archived: false })
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(10);

      if (goals.length === 0) {
        return {
          response: "Bạn chưa có mục tiêu nào.",
          action: "CHAT_RESPONSE",
        };
      }

      const goalList = goals
        .map((goal, index) => {
          const progress = (
            ((goal.currentAmount || 0) / goal.targetAmount) *
            100
          ).toFixed(1);
          const pinIcon = goal.isPinned ? "📌 " : "";
          const progressBar =
            progress >= 100 ? "✅" : progress >= 50 ? "🟡" : "🔴";

          return `${index + 1}. ${pinIcon}<strong>${
            goal.name
          }</strong> ${progressBar}\n   Tiến độ: <span class="progress">${(
            goal.currentAmount || 0
          ).toLocaleString()}đ / ${goal.targetAmount.toLocaleString()}đ (${progress}%)</span>`;
        })
        .join("\n\n");

      return {
        response: `🎯 <strong>Danh sách mục tiêu:</strong>\n\n${goalList}`,
        action: "CHAT_RESPONSE",
        data: {
          goals: goals.map((goal) => ({
            id: goal._id,
            name: goal.name,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount || 0,
            progress: (
              ((goal.currentAmount || 0) / goal.targetAmount) *
              100
            ).toFixed(1),
            isPinned: goal.isPinned,
            deadline: goal.deadline,
          })),
        },
      };
    } catch (error) {
      console.error("Error getting goal list:", error);
      return {
        response: "Có lỗi xảy ra khi lấy danh sách mục tiêu.",
        action: "CHAT_RESPONSE",
      };
    }
  }

  // Xử lý response follow-up khi đang chờ thông tin
  async handleFollowUpResponse(message, userId, conversationState) {
    const { waitingFor, pendingData, lastIntent } = conversationState;

    console.log("=== HANDLING FOLLOW-UP ===");
    console.log("Message:", message);
    console.log("Waiting for:", waitingFor);
    console.log("Pending data:", pendingData);

    try {
      if (waitingFor === "transaction_amount") {
        // Trích xuất số tiền từ message
        const amount = this.extractAmount(message);
        if (amount) {
          pendingData.amount = amount;

          // Reset conversation state
          this.resetConversationState(userId);

          // Trả về confirm transaction với đầy đủ data
          return {
            response: `Xác nhận thêm giao dịch:\n• Tên: ${
              pendingData.name
            }\n• Số tiền: ${amount.toLocaleString()}đ\n• Loại: ${
              pendingData.type === "CHITIEU" ? "Chi tiêu" : "Thu nhập"
            }\n• Danh mục: ${pendingData.categoryGuess}`,
            action: "CONFIRM_ADD_TRANSACTION",
            data: pendingData,
          };
        } else {
          return {
            response:
              "Vui lòng nhập số tiền cụ thể. Ví dụ: '20 triệu', '500k' hoặc '15000000'",
            action: "CHAT_RESPONSE",
          };
        }
      }

      if (waitingFor === "goal_amount") {
        // Trích xuất số tiền từ message
        const amount = this.extractAmount(message);
        if (amount) {
          pendingData.targetAmount = amount;
          this.updateConversationState(userId, {
            waitingFor: "goal_deadline",
            pendingData,
          });

          return {
            response: `Tốt! Mục tiêu ${amount.toLocaleString()}đ cho "${
              pendingData.name
            }". Bạn muốn hoàn thành vào lúc nào? (Ví dụ: "31/12/2025" hoặc "tháng 12")`,
            action: "CHAT_RESPONSE",
          };
        } else {
          return {
            response:
              "Vui lòng nhập số tiền cụ thể. Ví dụ: '5 triệu' hoặc '5000000'",
            action: "CHAT_RESPONSE",
          };
        }
      }

      if (waitingFor === "goal_deadline") {
        // Trích xuất ngày từ message
        const deadline = this.extractDate(message);
        if (deadline) {
          pendingData.deadline = deadline;

          // Reset conversation state
          this.resetConversationState(userId);

          // Trả về confirm goal với đầy đủ data
          return {
            response: `Xác nhận tạo mục tiêu:\n• Tên: ${
              pendingData.name
            }\n• Số tiền mục tiêu: ${pendingData.targetAmount.toLocaleString()}đ\n• Hạn: ${deadline}`,
            action: "CONFIRM_ADD_GOAL",
            data: pendingData,
          };
        } else {
          return {
            response:
              "Vui lòng nhập thời hạn rõ ràng. Ví dụ: '31/12/2025', 'cuối năm', 'tháng 6'",
            action: "CHAT_RESPONSE",
          };
        }
      }

      // Các trường hợp khác...
    } catch (error) {
      console.error("Follow-up error:", error);
      this.resetConversationState(userId);
      return {
        response: "Đã có lỗi xảy ra. Bạn có thể thử lại không?",
        action: "CHAT_RESPONSE",
      };
    }
  }

  // Trích xuất số tiền từ text - CẢI TIẾN
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
        // Xử lý số có dấu phẩy/chấm
        let amount = parseFloat(match[1].replace(/,/g, ""));

        if (isNaN(amount)) continue;

        // Áp dụng hệ số nhân
        if (/triệu|tr|million/i.test(text)) {
          amount *= 1000000;
        } else if (/nghìn|k|thousand/i.test(text)) {
          amount *= 1000;
        }

        // Đảm bảo là số nguyên và hợp lệ
        amount = Math.round(amount);
        if (amount > 0 && amount <= 999999999999) {
          // Max 999 tỷ
          return amount;
        }
      }
    }

    return null;
  }

  // Trích xuất ngày từ text
  extractDate(text) {
    if (!text) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Clean text
    const cleanText = text.toLowerCase().trim();

    // Patterns cho ngày cụ thể
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{1,2})\/(\d{1,2})/, // DD/MM (năm hiện tại)
    ];

    // Kiểm tra ngày cụ thể trước
    for (const pattern of datePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        if (match[3]) {
          // DD/MM/YYYY
          return `${match[1].padStart(2, "0")}/${match[2].padStart(2, "0")}/${
            match[3]
          }`;
        } else if (match[2]) {
          // DD/MM (năm hiện tại)
          return `${match[1].padStart(2, "0")}/${match[2].padStart(
            2,
            "0"
          )}/${currentYear}`;
        }
      }
    }

    // Xử lý các cụm từ thời gian phức tạp
    let targetMonth = null;
    let targetYear = currentYear;

    // Tìm tháng
    const monthPatterns = [
      /tháng\s*(\d{1,2})/i,
      /tháng\s*(một|hai|ba|bốn|tư|năm|sáu|bảy|tám|chín|mười|mười một|mười hai|mười hai)/i,
    ];

    const monthMap = {
      một: 1,
      hai: 2,
      ba: 3,
      bốn: 4,
      tư: 4,
      năm: 5,
      sáu: 6,
      bảy: 7,
      tám: 8,
      chín: 9,
      mười: 10,
      "mười một": 11,
      "mười hai": 12,
    };

    for (const pattern of monthPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        if (/^\d+$/.test(match[1])) {
          targetMonth = parseInt(match[1]);
        } else {
          targetMonth = monthMap[match[1]];
        }
        break;
      }
    }

    // Tìm năm
    const yearPatterns = [
      /năm\s*(\d{4})/i,
      /(\d{4})/,
      /năm\s*sau/i,
      /năm\s*tới/i,
      /năm\s*nữa/i,
    ];

    for (const pattern of yearPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        if (
          pattern.source.includes("sau") ||
          pattern.source.includes("tới") ||
          pattern.source.includes("nữa")
        ) {
          targetYear = currentYear + 1;
        } else if (match[1] && /^\d{4}$/.test(match[1])) {
          targetYear = parseInt(match[1]);
        }
        break;
      }
    }

    // Xử lý các trường hợp đặc biệt
    if (cleanText.includes("cuối năm")) {
      return `31/12/${targetYear}`;
    }

    if (cleanText.includes("đầu năm")) {
      return `31/01/${targetYear}`;
    }

    if (cleanText.includes("giữa năm")) {
      return `30/06/${targetYear}`;
    }

    if (cleanText.includes("cuối tháng") && targetMonth) {
      const lastDay = new Date(targetYear, targetMonth, 0).getDate();
      return `${lastDay}/${targetMonth
        .toString()
        .padStart(2, "0")}/${targetYear}`;
    }

    if (cleanText.includes("đầu tháng") && targetMonth) {
      return `01/${targetMonth.toString().padStart(2, "0")}/${targetYear}`;
    }

    // Nếu có tháng thì tạo ngày cuối tháng
    if (targetMonth && targetMonth >= 1 && targetMonth <= 12) {
      const lastDay = new Date(targetYear, targetMonth, 0).getDate();
      return `${lastDay}/${targetMonth
        .toString()
        .padStart(2, "0")}/${targetYear}`;
    }

    // Fallback patterns
    if (cleanText.includes("tuần sau")) {
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return `${nextWeek.getDate().toString().padStart(2, "0")}/${(
        nextWeek.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${nextWeek.getFullYear()}`;
    }

    if (cleanText.includes("tháng sau")) {
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      const lastDay = new Date(nextYear, nextMonth, 0).getDate();
      return `${lastDay}/${nextMonth.toString().padStart(2, "0")}/${nextYear}`;
    }

    return null;
  }

  // Extract tháng và năm từ user message
  extractMonthFromMessage(message) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Mapping Vietnamese months
    const monthMap = {
      1: 1,
      một: 1,
      một: 1,
      2: 2,
      hai: 2,
      3: 3,
      ba: 3,
      4: 4,
      bốn: 4,
      tư: 4,
      5: 5,
      năm: 5,
      6: 6,
      sáu: 6,
      7: 7,
      bảy: 7,
      8: 8,
      tám: 8,
      9: 9,
      chín: 9,
      10: 10,
      mười: 10,
      11: 11,
      "mười một": 11,
      12: 12,
      "mười hai": 12,
      chạp: 12,
    };

    const lowerMessage = message.toLowerCase();
    console.log("Parsing month from:", message);

    // Check for specific month numbers
    const monthRegex =
      /tháng\s*(\d+|một|hai|ba|bốn|tư|năm|sáu|bảy|tám|chín|mười|mười một|mười hai|chạp)/i;
    const monthMatch = lowerMessage.match(monthRegex);

    if (monthMatch) {
      const monthStr = monthMatch[1];
      const month = monthMap[monthStr] || parseInt(monthStr);
      console.log(`Found month: ${monthStr} -> ${month}`);

      if (month >= 1 && month <= 12) {
        return { month, year: currentYear };
      }
    }

    // Check for "tháng này" (this month)
    if (/tháng\s*(này|hiện tại)/i.test(lowerMessage)) {
      console.log("Found 'tháng này' -> current month");
      return { month: currentMonth, year: currentYear };
    }

    // Check for "tháng trước" (last month)
    if (/tháng\s*trước/i.test(lowerMessage)) {
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      console.log("Found 'tháng trước' ->", lastMonth, lastYear);
      return { month: lastMonth, year: lastYear };
    }

    // Default to current month
    console.log("No specific month found, using current month");
    return { month: currentMonth, year: currentYear };
  }

  // Thử xử lý local trước khi gọi Gemini API
  async tryLocalProcessing(message, userId) {
    const lowerMessage = message.toLowerCase().trim();

    // Patterns cho thống kê
    const statsPatterns = [
      /(?:xem|check|kiểm tra|thống kê|tổng kết).*(thống kê|tổng|chi tiêu|thu nhập|tài chính).*(?:tháng|month)/i,
      /tổng.*chi.*tiêu.*tháng/i,
      /thu.*nhập.*tháng/i,
      /báo.*cáo.*tài.*chính/i,
      /xem.*số.*dư/i,
      /tài.*chính.*tháng/i,
    ];

    for (const pattern of statsPatterns) {
      if (pattern.test(message)) {
        console.log("Local processing: QUICK_STATS pattern matched");

        // Extract month from message
        const monthInfo = this.extractMonthFromMessage(message);
        return await this.getQuickStats(
          userId,
          monthInfo.month,
          monthInfo.year
        );
      }
    }

    // Patterns cho xem danh sách
    const listPatterns = [
      /(?:xem|liệt kê|danh sách).*(?:giao dịch|transaction)/i,
      /giao.*dịch.*gần.*đây/i,
      /(?:xem|liệt kê|danh sách).*(?:tài khoản|account)/i,
      /(?:xem|liệt kê|danh sách).*(?:danh mục|category)/i,
      /(?:xem|liệt kê|danh sách).*(?:mục tiêu|goal)/i,
      /mục.*tiêu.*của.*tôi/i,
    ];

    for (const pattern of listPatterns) {
      if (pattern.test(message)) {
        if (/giao.*dịch/i.test(message)) {
          console.log("Local processing: LIST_TRANSACTIONS pattern matched");
          return await this.getRecentTransactions(userId);
        } else if (/tài.*khoản/i.test(message)) {
          console.log("Local processing: LIST_ACCOUNTS pattern matched");
          return await this.getAccountList(userId);
        } else if (/danh.*mục/i.test(message)) {
          console.log("Local processing: LIST_CATEGORIES pattern matched");
          return await this.getCategoryList(userId);
        } else if (/mục.*tiêu/i.test(message)) {
          console.log("Local processing: LIST_GOALS pattern matched");
          return await this.getGoalList(userId);
        }
      }
    }

    // Patterns cho thêm giao dịch đơn giản
    const transactionPatterns = [
      /(?:chi|mua|thanh toán|trả)\s+(\d+[k|nghìn|triệu|tr]?)\s+(.+)/i,
      /(?:thu|nhận|lương|tiền)\s+(\d+[k|nghìn|triệu|tr]?)\s*(.*)$/i,
    ];

    for (const pattern of transactionPatterns) {
      const match = message.match(pattern);
      if (match) {
        const amount = this.extractAmount(match[1]);
        const description = match[2] || "Giao dịch";
        const isExpense = /chi|mua|thanh toán|trả/i.test(message);

        if (amount && amount > 0) {
          console.log("Local processing: TRANSACTION pattern matched");
          return {
            response: `Xác nhận ${
              isExpense ? "chi tiêu" : "thu nhập"
            } <strong>${amount.toLocaleString()}đ</strong> cho "<em>${description}</em>"?`,
            action: "CONFIRM_ADD_TRANSACTION",
            data: {
              name: description,
              amount: amount,
              type: isExpense ? "CHITIEU" : "THUNHAP",
              categoryGuess: isExpense ? "Ăn uống" : "Thu nhập khác",
              accountGuess: null,
            },
          };
        }
      }
    }

    return null; // Không thể xử lý local, cần Gemini
  }

  // Gọi Gemini API với retry mechanism
  async callGeminiWithRetry(prompt, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Gemini API attempt ${attempt}/${maxRetries}`);

        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Gemini API timeout")), 30000)
          ),
        ]);

        console.log(`Gemini API successful on attempt ${attempt}`);
        return result;
      } catch (error) {
        lastError = error;
        console.log(`Gemini API attempt ${attempt} failed:`, error.message);

        // Nếu là 503 (overloaded), đợi thêm thời gian trước khi retry
        if (error.status === 503 && attempt < maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else if (attempt < maxRetries) {
          // Đợi 1 giây cho các lỗi khác
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    throw lastError;
  }

  // Xử lý fallback khi Gemini API không khả dụng - MỞ RỘNG
  async handleFallbackResponse(message, userId) {
    const lowerMessage = message.toLowerCase().trim();

    // Fallback cho thống kê
    if (
      /(?:thống kê|tổng|chi tiêu|thu nhập|báo cáo|số dư|tài chính).*(?:tháng|month)/i.test(
        message
      )
    ) {
      console.log("Fallback: Providing statistics");
      return await this.getQuickStats(userId, null, null);
    }

    // Fallback cho danh sách
    if (/(?:xem|liệt kê|danh sách)/i.test(message)) {
      if (/giao.*dịch/i.test(message)) {
        console.log("Fallback: Providing recent transactions");
        return await this.getRecentTransactions(userId);
      } else if (/tài.*khoản/i.test(message)) {
        console.log("Fallback: Providing account list");
        return await this.getAccountList(userId);
      } else if (/danh.*mục/i.test(message)) {
        console.log("Fallback: Providing category list");
        return await this.getCategoryList(userId);
      } else if (/mục.*tiêu/i.test(message)) {
        console.log("Fallback: Providing goal list");
        return await this.getGoalList(userId);
      }
    }

    // Fallback cho tạo mục tiêu
    if (/(?:tạo|thêm|đặt).*mục.*tiêu/i.test(message)) {
      console.log("Fallback: Handling goal creation");

      // Trích xuất thông tin từ message
      const goalInfo = this.extractGoalInfoFromMessage(message);

      if (goalInfo.name && goalInfo.amount) {
        // Có đủ thông tin để tạo mục tiêu
        const goalData = {
          name: goalInfo.name,
          targetAmount: goalInfo.amount,
          deadline: goalInfo.deadline,
        };

        return {
          response: `🎯 <strong>Xác nhận tạo mục tiêu:</strong>

📝 <strong>Tên:</strong> ${goalData.name}
💰 <strong>Số tiền mục tiêu:</strong> ${goalData.targetAmount.toLocaleString()}đ
📅 <strong>Thời hạn:</strong> ${goalData.deadline || "Một năm từ bây giờ"}

<em>Bạn có muốn tôi tạo mục tiêu này không?</em>`,
          action: "CONFIRM_ADD_GOAL",
          data: goalData,
        };
      } else if (goalInfo.name) {
        // Chỉ có tên, cần hỏi số tiền
        this.updateConversationState(userId, {
          waitingFor: "goal_amount",
          pendingData: { name: goalInfo.name },
          lastIntent: "ADD_GOAL",
        });

        return {
          response: `🎯 <strong>Mục tiêu "${goalInfo.name}"</strong>

Bạn muốn tiết kiệm bao nhiều tiền? 
<em>(Ví dụ: "5 triệu", "10 triệu đồng")</em>`,
          action: "CHAT_RESPONSE",
        };
      } else {
        // Không có thông tin cụ thể, hỏi tên mục tiêu
        return {
          response: `🎯 <strong>Tạo mục tiêu tiết kiệm mới</strong>

Bạn muốn tạo mục tiêu gì? 
<em>(Ví dụ: "Mua laptop 20 triệu", "Đi du lịch 5 triệu")</em>`,
          action: "CHAT_RESPONSE",
        };
      }
    }

    // Fallback cho câu hỏi chung về tính năng
    if (/(?:làm|có thể|giúp|hỗ trợ|tính năng)/i.test(message)) {
      return {
        response: `🤖 <strong>Tôi có thể giúp bạn:</strong>

💰 <strong>Thống kê & Báo cáo:</strong>
• "Xem thống kê tháng này"
• "Tổng chi tiêu tháng này"

📝 <strong>Quản lý giao dịch:</strong>
• "Chi 50k ăn sáng"
• "Thu 5 triệu lương"
• "Xem giao dịch gần đây"

📋 <strong>Danh sách & Quản lý:</strong>
• "Xem danh sách tài khoản"
• "Liệt kê danh mục"
• "Xem mục tiêu của tôi"

🎯 <strong>Mục tiêu & Kế hoạch:</strong>
• "Tạo mục tiêu tiết kiệm"
• "Thêm danh mục mới"

<em>Hãy thử một trong những câu lệnh trên!</em>`,
        action: "CHAT_RESPONSE",
      };
    }

    // Fallback chung
    return {
      response: `⚠️ <strong>Dịch vụ AI hiện đang bận.</strong>

Tôi vẫn có thể giúp bạn:
• "Xem thống kê tháng này"
• "Danh sách giao dịch"
• "Xem tài khoản"
• "Chi 50k ăn sáng"

<em>Hoặc nói "giúp tôi" để xem đầy đủ tính năng.</em>`,
      action: "CHAT_RESPONSE",
    };
  }

  // Trích xuất thông tin mục tiêu từ message
  extractGoalInfoFromMessage(message) {
    const goalInfo = {
      name: null,
      amount: null,
      deadline: null,
    };

    // Trích xuất số tiền
    goalInfo.amount = this.extractAmount(message);

    // Trích xuất thời hạn
    goalInfo.deadline = this.extractDate(message);

    // Trích xuất tên mục tiêu
    // Pattern: "tạo mục tiêu [tên] [số tiền]" hoặc "[số tiền] cho [tên]"
    const goalNamePatterns = [
      /(?:tạo|thêm|đặt).*mục.*tiêu\s+(.+?)(?:\s+\d|$)/i,
      /\d+.*?(?:cho|để)\s+(.+?)$/i,
      /mục.*tiêu\s+(.+?)(?:\s+\d|$)/i,
      /tiết.*kiệm.*?(.+?)(?:\s+\d|$)/i,
    ];

    for (const pattern of goalNamePatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        let name = match[1].trim();

        // Loại bỏ các từ khóa thừa
        name = name.replace(
          /\s*(?:với|bằng|khoảng|để|cho|vào|tháng|năm)\s*/gi,
          " "
        );
        name = name.replace(/\s*\d+.*$/g, ""); // Loại bỏ số ở cuối
        name = name.trim();

        if (name.length > 2) {
          goalInfo.name = name;
          break;
        }
      }
    }

    // Fallback: nếu không tìm được tên, thử tìm từ khóa chính
    if (!goalInfo.name) {
      const keywords = [
        "biển",
        "sapa",
        "du lịch",
        "laptop",
        "điện thoại",
        "nhà",
        "xe",
      ];
      for (const keyword of keywords) {
        if (message.toLowerCase().includes(keyword)) {
          goalInfo.name = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          break;
        }
      }
    }

    return goalInfo;
  }

  // ...existing code...
}

module.exports = AIController;
