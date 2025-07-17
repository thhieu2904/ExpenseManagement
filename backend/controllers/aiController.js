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

      // Sử dụng optimized Gemini call với system instructions
      console.log("=== CALLING OPTIMIZED GEMINI API ===");

      // Gọi Gemini API tối ưu
      const result = await this.callGeminiOptimized(
        message.trim(),
        userContext,
        3
      );

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
        aiResponse.originalMessage = message; // Thêm originalMessage để dùng cho extract date
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
        error.statusText === "Service Unavailable" ||
        error.status === 429 || // Add quota error
        error.message?.includes("quota") ||
        error.message?.includes("Too Many Requests")
      ) {
        errorMessage =
          error.status === 429
            ? "Đã vượt quá giới hạn API, sử dụng chế độ offline"
            : "Dịch vụ AI hiện đang quá tải, vui lòng thử lại sau";
        statusCode = 503;

        // Thử xử lý local fallback cho một số patterns phổ biến
        try {
          const fallbackResponse = await this.tryLocalProcessing(
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
          const fallbackResponse = await this.tryLocalProcessing(
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

  // --- HÀM MỚI: Xây dựng prompt cho Gemini ---
  // --- HÀM NÂNG CẤP: buildPrompt với context đầy đủ và entity extraction ---
  buildPrompt(userMessage, userContext) {
    const { categories, accounts, recentTransactions, currentDate } =
      userContext;

    // Tạo danh sách categories và accounts dưới dạng string với format chi tiết
    const categoryList = categories
      .map((c) => `"${c.name}" (${c.type})`)
      .join(", ");
    const accountList = accounts
      .map(
        (a) => `"${a.name}" (${a.type}${a.bankName ? `, ${a.bankName}` : ""})`
      )
      .join(", ");

    // Tạo danh sách để AI nhận diện entities
    const accountNames = accounts.map((a) => a.name).join(", ");
    const bankNames = accounts
      .filter((a) => a.bankName)
      .map((a) => a.bankName)
      .join(", ");
    const categoryNames = categories.map((c) => c.name).join(", ");

    return `
SYSTEM: Bạn là AI assistant chuyên về tài chính cá nhân. Phân tích yêu cầu người dùng, xác định INTENT và trích xuất ENTITIES (thực thể) cụ thể.

### THÔNG TIN NGƯỜI DÙNG HIỆN TẠI
- Ngày hiện tại: ${currentDate}
- Danh mục có sẵn: ${categoryList || "Chưa có danh mục nào"}
- Tài khoản có sẵn: ${accountList || "Chưa có tài khoản nào"}
- Giao dịch gần đây: ${
      recentTransactions
        .map((t) => `${t.name} (${t.amount.toLocaleString()}đ - ${t.type})`)
        .join(", ") || "Chưa có giao dịch nào"
    }

### DANH SÁCH ENTITIES ĐỂ NHẬN DIỆN
- Tên tài khoản: ${accountNames || "Không có"}
- Tên ngân hàng: ${bankNames || "Không có"}  
- Tên danh mục: ${categoryNames || "Không có"}

### YÊU CẦU NGƯỜI DÙNG
"${userMessage}"

### CÁC INTENT CÓ THỂ XỬ LÝ VÀ ENTITIES CẦN TRÍCH XUẤT
1. **ADD_ACCOUNT** - Thêm tài khoản mới (ngân hàng hoặc tiền mặt)
   - Entities: name, type (TIENMAT/THENGANHANG), bankName, accountNumber
   - Patterns: "tạo tài khoản", "thêm tài khoản", "mở tài khoản", "tạo ví"

2. **QUICK_STATS** - Xem thống kê, báo cáo, tổng quan
   - Entities: timeFilter (tháng này, tháng trước, tháng X)

3. **VIEW_ACCOUNTS** - Xem danh sách tài khoản và số dư
   - Entities: specificAccount (tên tài khoản cụ thể), bankFilter (ngân hàng cụ thể)

4. **VIEW_TRANSACTIONS** - Xem giao dịch
   - Entities: timeFilter, accountFilter, categoryFilter, amountFilter

5. **VIEW_CATEGORIES** - Xem danh sách danh mục
   - Entities: typeFilter (chi tiêu/thu nhập)

6. **VIEW_GOALS** - Xem mục tiêu
   - Entities: statusFilter (đang thực hiện, hoàn thành, quá hạn)

7. **ADD_TRANSACTION** - Thêm giao dịch mới
   - Entities: amount, description, accountGuess, categoryGuess

8. **ADD_CATEGORY** - Thêm danh mục mới
   - Entities: name, type

9. **ADD_GOAL** - Thêm mục tiêu mới  
   - Entities: name, targetAmount, deadline

10. **QUERY_TRANSACTIONS** - Tìm kiếm giao dịch
   - Entities: searchTerm, timeFilter, amountRange

11. **UNKNOWN** - Không xác định được

### HƯỚNG DẪN TRÍCH XUẤT ENTITIES
- **specificAccount**: Tìm chính xác tên tài khoản được nhắc đến
- **bankFilter**: Tìm tên ngân hàng (Vietcombank, BIDV, Techcombank, MB Bank, etc.)
- **timeFilter**: "tháng này", "tháng trước", "tháng X", "hôm nay", "tuần này", etc.
- **categoryFilter**: Tên danh mục cụ thể được nhắc đến
- **amountFilter**: Khoảng số tiền ("trên 1 triệu", "dưới 500k", etc.)
- **searchTerm**: Từ khóa tìm kiếm giao dịch

### QUY TẮC PHẢN HỒI
- Chỉ trả về JSON thuần túy, không có markdown hay giải thích
- LUÔN trích xuất entities từ câu nói của user
- Sử dụng đúng tên category/account có sẵn của user để match entities
- Với ADD_ACCOUNT: khi user nói "tạo tài khoản", "thêm tài khoản", "mở tài khoản" => PHẢI trả về intent: "ADD_ACCOUNT"
- Với VIEW_ACCOUNTS: nếu có specificAccount hoặc bankFilter, chỉ hiển thị những account đó
- Với ADD_TRANSACTION: phải có đầy đủ name, amount, type, accountGuess, categoryGuess
- Với QUICK_STATS: KHÔNG tự tạo số liệu, sử dụng timeFilter nếu có
- responseForUser phải ngắn gọn, thân thiện, phản ánh đúng entities được trích xuất

### XỬ LÝ THỜI GIAN CHO MỤC TIÊU
- Hiểu các cụm từ về NGÀY: "15/3/2026", "ngày 15 tháng 3", "15 tháng 3 năm 2026"
- Hiểu các cụm từ về THÁNG: "tháng 1 năm 2026", "tháng 1 năm sau", "cuối năm", "đầu năm sau"
- Hiểu các cụm từ về TUẦN: "tuần sau", "cuối tuần này", "đầu tuần tới"
- Hiểu các cụm từ về NGÀY GẦN: "hôm nay", "ngày mai", "ngày kia", "tuần tới", "tháng tới"
- Format deadline: "YYYY-MM-DD" (ví dụ: "2026-03-15" cho "15 tháng 3 năm 2026")
- Năm hiện tại: ${new Date().getFullYear()}
- Tháng hiện tại: ${new Date().getMonth() + 1}
- Ngày hiện tại: ${new Date().getDate()}
- Mặc định: nếu không có năm thì là năm hiện tại, nếu nói "năm sau/tới" thì +1 năm
- "cuối năm" = "31/12/năm", "đầu năm" = "31/01/năm", "tháng X" = "ngày cuối tháng X"
- "ngày mai" = +1 ngày, "tuần sau" = +7 ngày, "tháng sau" = +1 tháng

### VÍ DỤ XỬ LÝ THỜI GIAN CHI TIẾT
- "15/3/2026" → deadline: "2026-03-15"
- "ngày 15 tháng 3" → deadline: "${new Date().getFullYear()}-03-15"
- "15 tháng 3 năm 2026" → deadline: "2026-03-15"
- "tháng 1 năm 2026" → deadline: "2026-01-31"
- "tháng 1 năm sau" → deadline: "${new Date().getFullYear() + 1}-01-31"
- "cuối năm" → deadline: "${new Date().getFullYear()}-12-31"
- "tháng 6" → deadline: "${new Date().getFullYear()}-06-30"
- "ngày mai" → deadline: "${
      new Date(Date.now() + 86400000).toISOString().split("T")[0]
    }"
- "tuần sau" → deadline: "${
      new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
    }"
- "tháng tới" → deadline: "${
      new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        new Date().getDate()
      )
        .toISOString()
        .split("T")[0]
    }"

### FORMAT JSON BẮT BUỘC
{
  "intent": "...",
  "entities": {
    "specificAccount": "tên tài khoản cụ thể hoặc null",
    "bankFilter": "tên ngân hàng cụ thể hoặc null", 
    "categoryFilter": "tên danh mục cụ thể hoặc null",
    "timeFilter": "tháng này|tháng trước|tháng X|hôm nay|tuần này hoặc null",
    "amountFilter": "trên X|dưới X|từ X đến Y hoặc null",
    "searchTerm": "từ khóa tìm kiếm hoặc null",
    "typeFilter": "CHITIEU|THUNHAP hoặc null",
    "statusFilter": "active|completed|overdue hoặc null"
  },
  "transaction": null hoặc { "name": "...", "amount": số, "type": "CHITIEU/THUNHAP", "accountGuess": "...", "categoryGuess": "..." },
  "category": null hoặc { "name": "...", "type": "CHITIEU/THUNHAP" },
  "account": null hoặc { "name": "...", "type": "TIENMAT/THENGANHANG", "bankName": "...", "accountNumber": "..." },
  "goal": null hoặc { "name": "...", "targetAmount": số, "deadline": "YYYY-MM-DD" },
  "responseForUser": "Câu trả lời ngắn gọn phản ánh entities được trích xuất"
}

### VÍ DỤ TRÍCH XUẤT ENTITIES
User: "xem nguồn tiền Vietcombank"
Response:
{
  "intent": "VIEW_ACCOUNTS",
  "entities": {
    "specificAccount": null,
    "bankFilter": "Vietcombank",
    "categoryFilter": null,
    "timeFilter": null,
    "amountFilter": null,
    "searchTerm": null,
    "typeFilter": null,
    "statusFilter": null
  },
  "transaction": null,
  "category": null,
  "goal": null,
  "responseForUser": "Tôi sẽ xem các tài khoản Vietcombank của bạn."
}

User: "xem tài khoản Ví tiền mặt"
Response:
{
  "intent": "VIEW_ACCOUNTS",
  "entities": {
    "specificAccount": "Ví tiền mặt",
    "bankFilter": null,
    "categoryFilter": null,
    "timeFilter": null,
    "amountFilter": null,
    "searchTerm": null,
    "typeFilter": null,
    "statusFilter": null
  },
  "transaction": null,
  "category": null,
  "goal": null,
  "responseForUser": "Tôi sẽ xem thông tin tài khoản Ví tiền mặt của bạn."
}

User: "xem giao dịch ăn uống tháng này"
Response:
{
  "intent": "VIEW_TRANSACTIONS",
  "entities": {
    "specificAccount": null,
    "bankFilter": null,
    "categoryFilter": "Ăn uống",
    "timeFilter": "tháng này",
    "amountFilter": null,
    "searchTerm": null,
    "typeFilter": null,
    "statusFilter": null
  },
  "transaction": null,
  "category": null,
  "goal": null,
  "responseForUser": "Tôi sẽ xem các giao dịch ăn uống trong tháng này."
}

### VÍ DỤ
User: "chi 50k ăn sáng"
Response:
{
  "intent": "ADD_TRANSACTION",
  "entities": {
    "specificAccount": null,
    "bankFilter": null,
    "categoryFilter": null,
    "timeFilter": null,
    "amountFilter": null,
    "searchTerm": null,
    "typeFilter": null,
    "statusFilter": null
  },
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
  "entities": {
    "specificAccount": null,
    "bankFilter": null,
    "categoryFilter": null,
    "timeFilter": "tháng này",
    "amountFilter": null,
    "searchTerm": null,
    "typeFilter": null,
    "statusFilter": null
  },
  "transaction": null,
  "category": null,
  "goal": null,
  "responseForUser": "Để tôi xem thống kê tài chính tháng này cho bạn."
}

User: "tìm giao dịch trên 1 triệu"
Response:
{
  "intent": "QUERY_TRANSACTIONS",
  "entities": {
    "specificAccount": null,
    "bankFilter": null,
    "categoryFilter": null,
    "timeFilter": null,
    "amountFilter": "trên 1000000",
    "searchTerm": null,
    "typeFilter": null,
    "statusFilter": null
  },
  "transaction": null,
  "category": null,
  "goal": null,
  "responseForUser": "Tôi sẽ tìm các giao dịch có số tiền trên 1 triệu đồng."
}

User: "tạo tài khoản ACB mới"
Response:
{
  "intent": "ADD_ACCOUNT",
  "entities": {
    "specificAccount": null,
    "bankFilter": null,
    "categoryFilter": null,
    "timeFilter": null,
    "amountFilter": null,
    "searchTerm": null,
    "typeFilter": null,
    "statusFilter": null
  },
  "transaction": null,
  "category": null,
  "account": { "name": "Tài khoản ACB", "type": "THENGANHANG", "bankName": "ACB", "accountNumber": "" },
  "goal": null,
  "responseForUser": "Tôi sẽ tạo tài khoản ngân hàng ACB cho bạn."
}

User: "thêm tài khoản Vietcombank"
Response:
{
  "intent": "ADD_ACCOUNT",
  "entities": {
    "specificAccount": null,
    "bankFilter": null,
    "categoryFilter": null,
    "timeFilter": null,
    "amountFilter": null,
    "searchTerm": null,
    "typeFilter": null,
    "statusFilter": null
  },
  "transaction": null,
  "category": null,
  "account": { "name": "Tài khoản Vietcombank", "type": "THENGANHANG", "bankName": "Vietcombank", "accountNumber": "" },
  "goal": null,
  "responseForUser": "Tôi sẽ tạo tài khoản Vietcombank cho bạn."
}

User: "tạo ví tiền mặt mới"
Response:
{
  "intent": "ADD_ACCOUNT",
  "entities": {
    "specificAccount": null,
    "bankFilter": null,
    "categoryFilter": null,
    "timeFilter": null,
    "amountFilter": null,
    "searchTerm": null,
    "typeFilter": null,
    "statusFilter": null
  },
  "transaction": null,
  "category": null,
  "account": { "name": "Ví tiền mặt", "type": "TIENMAT", "bankName": "", "accountNumber": "" },
  "goal": null,
  "responseForUser": "Tôi sẽ tạo ví tiền mặt cho bạn."
}

User: "mở tài khoản Techcombank"
Response:
{
  "intent": "ADD_ACCOUNT",
  "entities": {
    "specificAccount": null,
    "bankFilter": null,
    "categoryFilter": null,
    "timeFilter": null,
    "amountFilter": null,
    "searchTerm": null,
    "typeFilter": null,
    "statusFilter": null
  },
  "transaction": null,
  "category": null,
  "account": { "name": "Tài khoản Techcombank", "type": "THENGANHANG", "bankName": "Techcombank", "accountNumber": "" },
  "goal": null,
  "responseForUser": "Tôi sẽ mở tài khoản Techcombank cho bạn."
}

User: "tạo tài khoản BIDV số 123456"
Response:
{
  "intent": "ADD_ACCOUNT", 
  "entities": {
    "specificAccount": null,
    "bankFilter": null,
    "categoryFilter": null,
    "timeFilter": null,
    "amountFilter": null,
    "searchTerm": null,
    "typeFilter": null,
    "statusFilter": null
  },
  "transaction": null,
  "category": null,
  "account": { "name": "Tài khoản BIDV", "type": "THENGANHANG", "bankName": "BIDV", "accountNumber": "123456" },
  "goal": null,
  "responseForUser": "Tôi sẽ tạo tài khoản BIDV số 123456 cho bạn."
}
    `;
  }

  // --- HÀM XỬ LÝ RESPONSE CẢI TIẾN ---
  async handleAIResponse(aiResponse, userId) {
    const { intent, transaction, category, goal, responseForUser, entities } =
      aiResponse;

    console.log("=== HANDLING AI RESPONSE ===");
    console.log("Intent:", intent);
    console.log("Entities:", JSON.stringify(entities, null, 2));
    console.log("Transaction data:", transaction);
    console.log("Category data:", category);
    console.log("Goal data:", goal);

    switch (intent) {
      case "ADD_TRANSACTION":
        return await this.handleAddTransaction(
          transaction,
          userId,
          responseForUser,
          aiResponse.originalMessage || ""
        );

      case "ADD_CATEGORY":
        return await this.handleAddCategory(category, userId, responseForUser);

      case "ADD_ACCOUNT":
        return await this.handleAddAccount(
          aiResponse.account,
          userId,
          responseForUser
        );

      case "ADD_GOAL":
        return await this.handleAddGoal(goal, userId, responseForUser);

      case "QUICK_STATS":
        // For QUICK_STATS từ Gemini, sử dụng timeFilter từ entities
        const timeFilter = entities?.timeFilter;
        return await this.getQuickStatsWithFilter(userId, timeFilter);

      case "VIEW_ACCOUNTS":
        // Xem danh sách tài khoản với filter từ entities
        return await this.getAccountListWithFilter(userId, entities);

      case "VIEW_TRANSACTIONS":
        // Xem giao dịch với filter từ entities
        return await this.getTransactionsWithFilter(
          userId,
          entities,
          responseForUser
        );

      case "VIEW_CATEGORIES":
        // Xem danh mục với filter từ entities
        return await this.getCategoryListWithFilter(userId, entities);

      case "VIEW_GOALS":
        // Xem mục tiêu với filter từ entities
        return await this.getGoalListWithFilter(userId, entities);

      case "QUERY_TRANSACTIONS":
        return await this.handleQueryTransactionsWithFilter(
          userId,
          entities,
          responseForUser
        );

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
  async handleAddTransaction(
    transaction,
    userId,
    responseForUser,
    originalMessage = ""
  ) {
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
            originalMessage: originalMessage, // Lưu message gốc để extract date sau
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

      // Extract date từ originalMessage nếu có
      let transactionDate = new Date(); // Default là hôm nay
      if (originalMessage) {
        transactionDate =
          this.extractDateFromTransactionMessage(originalMessage);
        console.log("=== EXTRACTING DATE FROM ORIGINAL MESSAGE ===");
        console.log("Original message:", originalMessage);
        console.log("Extracted date:", transactionDate);
        console.log("=== END EXTRACT DATE ===");
      }

      // Format date cho hiển thị
      const formattedDate = transactionDate.toLocaleDateString("vi-VN");

      return {
        response:
          responseForUser ||
          `Xác nhận thêm giao dịch:\n• Tên: ${
            transaction.name
          }\n• Số tiền: ${Number(
            transaction.amount
          ).toLocaleString()}đ\n• Loại: ${
            transaction.type === "CHITIEU" ? "Chi tiêu" : "Thu nhập"
          }\n• Danh mục: ${
            transaction.categoryGuess || "Không xác định"
          }\n• Ngày: ${formattedDate}`,
        action: "CONFIRM_ADD_TRANSACTION",
        data: {
          name: transaction.name,
          amount: Number(transaction.amount),
          type: transaction.type,
          categoryGuess: transaction.categoryGuess,
          accountGuess: transaction.accountGuess,
          date: transactionDate, // Thêm date vào data
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
          icon: this.getCategoryIcon(category.name, category.type),
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

  // Xử lý thêm tài khoản
  async handleAddAccount(account, userId, responseForUser) {
    try {
      if (!account || !account.name) {
        return {
          response: "Tên tài khoản không được để trống. Vui lòng thử lại.",
          action: "CHAT_RESPONSE",
        };
      }

      // Set default type nếu không có
      const accountType = account.type || "TIENMAT";
      const bankName = account.bankName || null;

      return {
        response:
          responseForUser ||
          `Xác nhận tạo tài khoản:\n• Tên: ${account.name}\n• Loại: ${
            accountType === "TIENMAT" ? "Tiền mặt" : "Thẻ ngân hàng"
          }${bankName ? `\n• Ngân hàng: ${bankName}` : ""}`,
        action: "CONFIRM_ADD_ACCOUNT",
        data: {
          name: account.name,
          type: accountType,
          bankName: bankName,
          accountNumber: account.accountNumber || "", // Thêm accountNumber
          initialBalance: account.initialBalance || 0,
        },
      };
    } catch (error) {
      console.error("Error handling add account:", error);
      return {
        response:
          "Có lỗi xảy ra khi xử lý thông tin tài khoản. Vui lòng thử lại.",
        action: "CHAT_RESPONSE",
      };
    }
  }

  // Xử lý thêm mục tiêu
  async handleAddGoal(goal, userId, responseForUser) {
    try {
      console.log("=== HANDLING ADD GOAL ===");
      console.log("Goal input:", JSON.stringify(goal, null, 2));
      console.log("User ID:", userId);
      console.log("Response for user:", responseForUser);
      console.log("=== END HANDLING ADD GOAL DEBUG ===");

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
        console.log("=== GOAL MISSING DEADLINE ===");
        console.log("Goal deadline:", goal.deadline);
        console.log("Setting up conversation state for deadline input...");

        this.updateConversationState(userId, {
          waitingFor: "goal_deadline",
          pendingData: {
            name: goal.name,
            targetAmount: goal.targetAmount,
          },
          lastIntent: "ADD_GOAL",
        });

        console.log("=== END DEADLINE SETUP ===");

        // Override responseForUser để hỏi deadline
        const deadlineQuestion = `Mục tiêu ${Number(
          goal.targetAmount
        ).toLocaleString()}đ cho "${
          goal.name
        }". Bạn muốn hoàn thành vào lúc nào? (Ví dụ: "tháng 12 2025", "cuối năm", "31/12/2025")`;

        return {
          response: deadlineQuestion,
          action: "CHAT_RESPONSE",
        };
      }

      // Nếu có đầy đủ thông tin thì confirm
      console.log("=== GOAL HAS ALL INFO, CONFIRMING ===");
      console.log("Final goal data:", {
        name: goal.name,
        targetAmount: goal.targetAmount,
        deadline: goal.deadline,
      });

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

  // Lấy danh sách tài khoản với filter từ entities
  async getAccountListWithFilter(userId, entities) {
    try {
      console.log("=== GETTING ACCOUNTS WITH FILTER ===");
      console.log("Entities:", JSON.stringify(entities, null, 2));

      const userObjectId =
        typeof userId === "string"
          ? new mongoose.Types.ObjectId(userId)
          : userId;

      // Tạo filter query dựa trên entities
      let accountFilter = { userId: userObjectId };

      // Filter theo tài khoản cụ thể
      if (entities?.specificAccount) {
        accountFilter.name = {
          $regex: new RegExp(entities.specificAccount, "i"),
        };
      }

      // Filter theo ngân hàng
      if (entities?.bankFilter) {
        accountFilter.bankName = {
          $regex: new RegExp(entities.bankFilter, "i"),
        };
      }

      console.log("Account filter:", accountFilter);

      const accounts = await Account.find(accountFilter);

      if (accounts.length === 0) {
        const filterText = entities?.specificAccount
          ? `tài khoản "${entities.specificAccount}"`
          : entities?.bankFilter
          ? `ngân hàng "${entities.bankFilter}"`
          : "tài khoản";

        return {
          response: `Không tìm thấy ${filterText} nào.`,
          action: "CHAT_RESPONSE",
        };
      }

      console.log("Found filtered accounts:", accounts.length);

      let totalBalance = 0;
      const accountsWithBalance = [];

      // Tính balance thực cho mỗi account
      for (const account of accounts) {
        const initialBalance = account.initialBalance || 0;

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

        const realBalance = initialBalance + accountTransactionSum;
        totalBalance += realBalance;

        accountsWithBalance.push({
          ...account.toObject(),
          realBalance,
        });
      }

      // Tạo tiêu đề phù hợp với filter
      let title = "💼 <strong>Danh sách tài khoản";
      if (entities?.specificAccount) {
        title += ` "${entities.specificAccount}"`;
      } else if (entities?.bankFilter) {
        title += ` ${entities.bankFilter}`;
      }
      title += ":</strong>";

      const accountList = accountsWithBalance
        .map((acc, index) => {
          const typeText =
            acc.type === "TIENMAT" ? "💵 Tiền mặt" : "🏦 Ngân hàng";
          const bankInfo = acc.bankName ? ` (${acc.bankName})` : "";
          const balance = acc.realBalance;
          const balanceColor = balance >= 0 ? "positive" : "negative";
          return `${index + 1}. <strong>${
            acc.name
          }</strong> ${typeText}${bankInfo} - <span class="balance ${balanceColor}">${balance.toLocaleString()}đ</span>`;
        })
        .join("\n");

      return {
        response: `${title}\n\n${accountList}\n\n<strong>Tổng số dư: ${totalBalance.toLocaleString()}đ</strong>`,
        action: "CHAT_RESPONSE",
        data: {
          accounts: accountsWithBalance.map((acc) => ({
            id: acc._id,
            name: acc.name,
            type: acc.type,
            balance: acc.realBalance,
            initialBalance: acc.initialBalance || 0,
            bankName: acc.bankName,
          })),
          totalBalance,
          filters: entities,
        },
      };
    } catch (error) {
      console.error("Error getting filtered account list:", error);
      return {
        response: "Có lỗi xảy ra khi lấy danh sách tài khoản.",
        action: "CHAT_RESPONSE",
      };
    }
  }

  // Lấy giao dịch với filter từ entities
  async getTransactionsWithFilter(userId, entities, responseForUser) {
    try {
      console.log("=== GETTING TRANSACTIONS WITH FILTER ===");
      console.log("Entities:", JSON.stringify(entities, null, 2));

      const userObjectId =
        typeof userId === "string"
          ? new mongoose.Types.ObjectId(userId)
          : userId;

      // Tạo filter query dựa trên entities
      let transactionFilter = { userId: userObjectId };
      let dateFilter = {};

      // Filter theo thời gian
      if (entities?.timeFilter) {
        const timeInfo = this.parseTimeFilter(entities.timeFilter);
        if (timeInfo) {
          const startOfMonth = new Date(timeInfo.year, timeInfo.month - 1, 1);
          const endOfMonth = new Date(
            timeInfo.year,
            timeInfo.month,
            0,
            23,
            59,
            59,
            999
          );
          dateFilter = {
            date: {
              $gte: startOfMonth,
              $lte: endOfMonth,
            },
          };
        }
      }

      // Filter theo danh mục
      if (entities?.categoryFilter) {
        const category = await Category.findOne({
          userId: userObjectId,
          name: { $regex: new RegExp(entities.categoryFilter, "i") },
        });
        if (category) {
          transactionFilter.categoryId = category._id;
        }
      }

      // Filter theo tài khoản
      if (entities?.specificAccount) {
        const account = await Account.findOne({
          userId: userObjectId,
          name: { $regex: new RegExp(entities.specificAccount, "i") },
        });
        if (account) {
          transactionFilter.accountId = account._id;
        }
      }

      // Filter theo số tiền
      if (entities?.amountFilter) {
        const amountCondition = this.parseAmountFilter(entities.amountFilter);
        if (amountCondition) {
          transactionFilter.amount = amountCondition;
        }
      }

      // Combine filters
      const finalFilter = { ...transactionFilter, ...dateFilter };
      console.log("Transaction filter:", finalFilter);

      const transactions = await Transaction.find(finalFilter)
        .sort({ date: -1 })
        .limit(20)
        .populate("categoryId", "name type")
        .populate("accountId", "name type");

      if (transactions.length === 0) {
        return {
          response:
            responseForUser ||
            "Không tìm thấy giao dịch nào phù hợp với điều kiện.",
          action: "CHAT_RESPONSE",
        };
      }

      // Tạo tiêu đề phù hợp với filter
      let title = "📋 <strong>Giao dịch";
      if (entities?.categoryFilter) title += ` ${entities.categoryFilter}`;
      if (entities?.timeFilter) title += ` ${entities.timeFilter}`;
      if (entities?.specificAccount) title += ` từ ${entities.specificAccount}`;
      title += ":</strong>";

      const transactionList = transactions
        .map((t, index) => {
          const typeIcon = t.type === "CHITIEU" ? "💸" : "💰";
          const amount = t.amount ? t.amount.toLocaleString() : "0";
          const formattedDate = new Date(t.date).toLocaleDateString("vi-VN");

          return `${index + 1}. ${typeIcon} ${t.name} - ${amount}đ
   📂 ${t.categoryId?.name || "Không có danh mục"}
   🏦 ${t.accountId?.name || "Không có tài khoản"}
   📅 ${formattedDate}`;
        })
        .join("\n\n");

      return {
        response: `${title}\n\n${transactionList}`,
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
          filters: entities,
        },
      };
    } catch (error) {
      console.error("Error getting filtered transactions:", error);
      return {
        response: "Có lỗi xảy ra khi lấy danh sách giao dịch.",
        action: "CHAT_RESPONSE",
      };
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

  // Parse amount filter thành MongoDB condition
  parseAmountFilter(amountFilter) {
    if (!amountFilter) return null;

    const lowerFilter = amountFilter.toLowerCase();

    // "trên X"
    const aboveMatch = lowerFilter.match(/trên\s*(\d+)/);
    if (aboveMatch) {
      return { $gt: parseInt(aboveMatch[1]) };
    }

    // "dưới X"
    const belowMatch = lowerFilter.match(/dưới\s*(\d+)/);
    if (belowMatch) {
      return { $lt: parseInt(belowMatch[1]) };
    }

    // "từ X đến Y"
    const rangeMatch = lowerFilter.match(/từ\s*(\d+)\s*đến\s*(\d+)/);
    if (rangeMatch) {
      return {
        $gte: parseInt(rangeMatch[1]),
        $lte: parseInt(rangeMatch[2]),
      };
    }

    return null;
  }

  // Lấy danh mục với filter
  async getCategoryListWithFilter(userId, entities) {
    try {
      const userObjectId =
        typeof userId === "string"
          ? new mongoose.Types.ObjectId(userId)
          : userId;

      let categoryFilter = { userId: userObjectId };

      // Filter theo type nếu có
      if (entities?.typeFilter) {
        categoryFilter.type = entities.typeFilter;
      }

      const categories = await Category.find(categoryFilter).sort({
        type: 1,
        name: 1,
      });

      if (categories.length === 0) {
        return {
          response: "Không tìm thấy danh mục nào phù hợp.",
          action: "CHAT_RESPONSE",
        };
      }

      const incomeCategories = categories.filter((c) => c.type === "THUNHAP");
      const expenseCategories = categories.filter((c) => c.type === "CHITIEU");

      let responseText = "📂 <strong>Danh sách danh mục";
      if (entities?.typeFilter === "CHITIEU") {
        responseText += " chi tiêu";
      } else if (entities?.typeFilter === "THUNHAP") {
        responseText += " thu nhập";
      }
      responseText += ":</strong>\n\n";

      if (entities?.typeFilter !== "THUNHAP" && expenseCategories.length > 0) {
        responseText += "💸 <strong>Chi tiêu:</strong>\n";
        responseText += expenseCategories
          .map((cat, index) => `${index + 1}. ${cat.name}`)
          .join("\n");
        responseText += "\n\n";
      }

      if (entities?.typeFilter !== "CHITIEU" && incomeCategories.length > 0) {
        responseText += "💰 <strong>Thu nhập:</strong>\n";
        responseText += incomeCategories
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
          filters: entities,
        },
      };
    } catch (error) {
      console.error("Error getting filtered categories:", error);
      return await this.getCategoryList(userId);
    }
  }

  // Lấy mục tiêu với filter
  async getGoalListWithFilter(userId, entities) {
    try {
      let goalFilter = { user: userId, archived: false };
      let sortOrder = { isPinned: -1, createdAt: -1 };

      // Filter theo status nếu có
      if (entities?.statusFilter === "completed") {
        // Mục tiêu hoàn thành (currentAmount >= targetAmount)
        goalFilter = {
          ...goalFilter,
          $expr: { $gte: ["$currentAmount", "$targetAmount"] },
        };
      } else if (entities?.statusFilter === "overdue") {
        // Mục tiêu quá hạn
        goalFilter.deadline = { $lt: new Date() };
      } else if (entities?.statusFilter === "nearest_deadline") {
        // Mục tiêu gần nhất (sắp hết hạn)
        goalFilter.deadline = { $exists: true, $ne: null };
        sortOrder = { deadline: 1 }; // Sắp xếp theo deadline gần nhất
      }

      const goals = await Goal.find(goalFilter).sort(sortOrder).limit(10);

      if (goals.length === 0) {
        return {
          response: "Không tìm thấy mục tiêu nào phù hợp.",
          action: "CHAT_RESPONSE",
        };
      }

      let title = "🎯 <strong>Danh sách mục tiêu";
      if (entities?.statusFilter === "completed") {
        title += " đã hoàn thành";
      } else if (entities?.statusFilter === "overdue") {
        title += " quá hạn";
      } else if (entities?.statusFilter === "nearest_deadline") {
        title += " gần nhất (theo thời hạn)";
      }
      title += ":</strong>";

      const goalList = goals
        .map((goal, index) => {
          const progress = (
            ((goal.currentAmount || 0) / goal.targetAmount) *
            100
          ).toFixed(1);
          const pinIcon = goal.isPinned ? "📌 " : "";
          const progressBar =
            progress >= 100 ? "✅" : progress >= 50 ? "🟡" : "🔴";

          // Format deadline với thông tin thời gian chi tiết
          let deadlineText = "";
          if (goal.deadline) {
            const deadlineDate = new Date(goal.deadline);
            const now = new Date();
            const diffTime = deadlineDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const formattedDate = deadlineDate.toLocaleDateString("vi-VN");

            if (diffDays < 0) {
              deadlineText = `⚠️ Quá hạn ${Math.abs(
                diffDays
              )} ngày (${formattedDate})`;
            } else if (diffDays === 0) {
              deadlineText = `🔥 Hạn cuối hôm nay (${formattedDate})`;
            } else if (diffDays <= 7) {
              deadlineText = `⏰ Còn ${diffDays} ngày (${formattedDate})`;
            } else if (diffDays <= 30) {
              deadlineText = `📅 Còn ${diffDays} ngày (${formattedDate})`;
            } else {
              deadlineText = `📅 Hạn: ${formattedDate}`;
            }
          } else {
            deadlineText = "📅 Chưa đặt hạn";
          }

          return `${index + 1}. ${pinIcon}<strong>${
            goal.name
          }</strong> ${progressBar}\n   💰 Tiến độ: <span class="progress">${(
            goal.currentAmount || 0
          ).toLocaleString()}đ / ${goal.targetAmount.toLocaleString()}đ (${progress}%)</span>\n   ${deadlineText}\n   ────────────────────────────────────────`;
        })
        .join("\n\n");

      return {
        response: `${title}\n\n${goalList}`,
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
            formattedDeadline: goal.deadline
              ? new Date(goal.deadline).toLocaleDateString("vi-VN")
              : null,
            daysRemaining: goal.deadline
              ? Math.ceil(
                  (new Date(goal.deadline).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : null,
          })),
          filters: entities,
        },
      };
    } catch (error) {
      console.error("Error getting filtered goals:", error);
      return await this.getGoalList(userId);
    }
  }

  // Xử lý tìm kiếm giao dịch với entities
  async handleQueryTransactionsWithFilter(userId, entities, responseForUser) {
    // Sử dụng getTransactionsWithFilter để xử lý tìm kiếm
    return await this.getTransactionsWithFilter(
      userId,
      entities,
      responseForUser
    );
  }
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

      const {
        amount,
        type,
        name,
        description,
        accountGuess,
        categoryGuess,
        date,
      } = req.body;
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
        date: date ? new Date(date) : new Date(), // Sử dụng date từ request hoặc ngày hiện tại
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

  // Thực hiện tạo tài khoản tự động - sử dụng trực tiếp accountController
  async createAccount(req, res) {
    try {
      console.log("=== AI CREATE ACCOUNT ===");
      console.log("Request body:", req.body);

      const { name, type, bankName, accountNumber, initialBalance } = req.body;
      const userId = req.user.id;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Thiếu tên tài khoản",
        });
      }

      // Sử dụng trực tiếp accountController
      const accountController = require("./accountController");

      // Tạo request data chuẩn cho accountController
      const accountReq = {
        user: { id: userId },
        body: {
          name,
          type: type || "TIENMAT",
          bankName: bankName || null,
          accountNumber: accountNumber || "", // Thêm accountNumber
          initialBalance: initialBalance || 0,
        },
      };

      // Tạo promise để capture response từ accountController
      const accountResult = await new Promise((resolve, reject) => {
        const mockRes = {
          status: (code) => {
            mockRes.statusCode = code;
            return mockRes;
          },
          json: (data) => {
            if (mockRes.statusCode >= 400) {
              reject(new Error(data.message || "Account creation failed"));
            } else {
              resolve(data);
            }
          },
        };

        accountController.createAccount(accountReq, mockRes);
      });

      res.json({
        success: true,
        message: "Tài khoản đã được tạo thành công bởi AI",
        account: accountResult.account || accountResult.data,
      });
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo tài khoản",
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
        .map((t, index) => {
          const typeIcon = t.type === "CHITIEU" ? "💸" : "💰";
          const formattedDate = new Date(t.date).toLocaleDateString("vi-VN");

          return `${index + 1}. ${typeIcon} ${
            t.name
          } - ${t.amount.toLocaleString()}đ
   📂 ${t.categoryId?.name || "Không có danh mục"}
   📅 ${formattedDate}`;
        })
        .join("\n\n");

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

      console.log("=== GETTING ACCOUNT LIST WITH REAL BALANCE ===");
      console.log("Found accounts:", accounts.length);

      let totalBalance = 0;
      const accountsWithBalance = [];

      // Tính balance thực cho mỗi account
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

        const realBalance = initialBalance + accountTransactionSum;
        totalBalance += realBalance;

        accountsWithBalance.push({
          ...account.toObject(),
          realBalance,
        });

        console.log(
          `Account: ${account.name}, Initial: ${initialBalance}, Transactions: ${accountTransactionSum}, Real Balance: ${realBalance}`
        );
      }

      console.log("Total balance calculated:", totalBalance);
      console.log("=== END GETTING ACCOUNT LIST ===");

      const accountList = accountsWithBalance
        .map((acc, index) => {
          const typeText =
            acc.type === "TIENMAT" ? "💵 Tiền mặt" : "🏦 Ngân hàng";
          const bankInfo = acc.bankName ? ` (${acc.bankName})` : "";
          const balance = acc.realBalance;
          const balanceColor = balance >= 0 ? "positive" : "negative";
          return `${index + 1}. <strong>${
            acc.name
          }</strong> ${typeText}${bankInfo} - <span class="balance ${balanceColor}">${balance.toLocaleString()}đ</span>`;
        })
        .join("\n");

      return {
        response: `💼 <strong>Danh sách tài khoản:</strong>\n\n${accountList}\n\n<strong>Tổng số dư: ${totalBalance.toLocaleString()}đ</strong>`,
        action: "CHAT_RESPONSE",
        data: {
          accounts: accountsWithBalance.map((acc) => ({
            id: acc._id,
            name: acc.name,
            type: acc.type,
            balance: acc.realBalance,
            initialBalance: acc.initialBalance || 0,
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

  // Lấy danh sách mục tiêu - CẢI TIẾN HIỂN THỊ THỜI GIAN
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

          // Format deadline với thông tin thời gian chi tiết
          let deadlineText = "";
          if (goal.deadline) {
            const deadlineDate = new Date(goal.deadline);
            const now = new Date();
            const diffTime = deadlineDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const formattedDate = deadlineDate.toLocaleDateString("vi-VN");

            if (diffDays < 0) {
              deadlineText = `⚠️ Quá hạn ${Math.abs(
                diffDays
              )} ngày (${formattedDate})`;
            } else if (diffDays === 0) {
              deadlineText = `🔥 Hạn cuối hôm nay (${formattedDate})`;
            } else if (diffDays <= 7) {
              deadlineText = `⏰ Còn ${diffDays} ngày (${formattedDate})`;
            } else if (diffDays <= 30) {
              deadlineText = `📅 Còn ${diffDays} ngày (${formattedDate})`;
            } else {
              deadlineText = `📅 Hạn: ${formattedDate}`;
            }
          } else {
            deadlineText = "📅 Chưa đặt hạn";
          }

          return `${index + 1}. ${pinIcon}<strong>${
            goal.name
          }</strong> ${progressBar}\n   💰 Tiến độ: <span class="progress">${(
            goal.currentAmount || 0
          ).toLocaleString()}đ / ${goal.targetAmount.toLocaleString()}đ (${progress}%)</span>\n   ${deadlineText}\n   ────────────────────────────────────────`;
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
            formattedDeadline: goal.deadline
              ? new Date(goal.deadline).toLocaleDateString("vi-VN")
              : null,
            daysRemaining: goal.deadline
              ? Math.ceil(
                  (new Date(goal.deadline).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : null,
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

          // Extract date từ original message hoặc current message
          let transactionDate = new Date();
          if (pendingData.originalMessage) {
            transactionDate = this.extractDateFromTransactionMessage(
              pendingData.originalMessage
            );
          }

          // Format date cho hiển thị
          const formattedDate = transactionDate.toLocaleDateString("vi-VN");

          // Reset conversation state
          this.resetConversationState(userId);

          // Trả về confirm transaction với đầy đủ data
          return {
            response: `Xác nhận thêm giao dịch:\n• Tên: ${
              pendingData.name
            }\n• Số tiền: ${amount.toLocaleString()}đ\n• Loại: ${
              pendingData.type === "CHITIEU" ? "Chi tiêu" : "Thu nhập"
            }\n• Danh mục: ${
              pendingData.categoryGuess
            }\n• Ngày: ${formattedDate}`,
            action: "CONFIRM_ADD_TRANSACTION",
            data: {
              ...pendingData,
              amount: amount,
              date: transactionDate,
            },
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
        console.log("=== EXTRACTING DEADLINE ===");
        console.log("Input message:", message);
        console.log("Extracted deadline:", deadline);
        console.log("=== END DEADLINE EXTRACTION ===");

        if (deadline) {
          // Convert DD/MM/YYYY to YYYY-MM-DD format for database
          let formattedDeadline = deadline;
          if (deadline.includes("/")) {
            const parts = deadline.split("/");
            if (parts.length === 3) {
              formattedDeadline = `${parts[2]}-${parts[1].padStart(
                2,
                "0"
              )}-${parts[0].padStart(2, "0")}`;
            }
          }

          pendingData.deadline = formattedDeadline;
          console.log("=== SETTING DEADLINE ===");
          console.log("Original deadline:", deadline);
          console.log("Formatted deadline:", formattedDeadline);
          console.log("Final pending data:", pendingData);
          console.log("=== END SETTING DEADLINE ===");

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

  // Trích xuất ngày từ text - CẢI TIẾN HỖ TRỢ NGÀY CỤ THỂ
  extractDate(text) {
    if (!text) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    // Clean text
    const cleanText = text.toLowerCase().trim();

    // Patterns cho ngày cụ thể - MỞ RỘNG THÊM NHIỀU FORMAT
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{1,2})\/(\d{1,2})/, // DD/MM (năm hiện tại)
      /(\d{1,2})-(\d{1,2})-(\d{4})/, // DD-MM-YYYY
      /(\d{1,2})-(\d{1,2})/, // DD-MM (năm hiện tại)
      /ngày\s*(\d{1,2})\s*\/\s*(\d{1,2})/, // ngày DD/MM
      /ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i, // ngày X tháng Y năm Z
      /ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})/i, // ngày X tháng Y (năm hiện tại)
      /(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i, // X tháng Y năm Z
      /(\d{1,2})\s*tháng\s*(\d{1,2})/i, // X tháng Y (năm hiện tại)
      /vào\s*ngày\s*(\d{1,2})\/(\d{1,2})/i, // vào ngày DD/MM
      /vào\s*(\d{1,2})\/(\d{1,2})/i, // vào DD/MM
    ];

    // Kiểm tra ngày cụ thể trước
    for (const pattern of datePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        if (pattern.source.includes("ngày.*tháng.*năm")) {
          // "ngày X tháng Y năm Z"
          const day = parseInt(match[1]);
          const month = parseInt(match[2]);
          const year = parseInt(match[3]);
          if (this.isValidDate(day, month, year)) {
            return `${day.toString().padStart(2, "0")}/${month
              .toString()
              .padStart(2, "0")}/${year}`;
          }
        } else if (pattern.source.includes("ngày.*tháng")) {
          // "ngày X tháng Y"
          const day = parseInt(match[1]);
          const month = parseInt(match[2]);
          if (this.isValidDate(day, month, currentYear)) {
            return `${day.toString().padStart(2, "0")}/${month
              .toString()
              .padStart(2, "0")}/${currentYear}`;
          }
        } else if (pattern.source.includes("tháng.*năm")) {
          // "X tháng Y năm Z"
          const day = parseInt(match[1]);
          const month = parseInt(match[2]);
          const year = parseInt(match[3]);
          if (this.isValidDate(day, month, year)) {
            return `${day.toString().padStart(2, "0")}/${month
              .toString()
              .padStart(2, "0")}/${year}`;
          }
        } else if (pattern.source.includes("tháng")) {
          // "X tháng Y"
          const day = parseInt(match[1]);
          const month = parseInt(match[2]);
          if (this.isValidDate(day, month, currentYear)) {
            return `${day.toString().padStart(2, "0")}/${month
              .toString()
              .padStart(2, "0")}/${currentYear}`;
          }
        } else if (
          pattern.source.includes("vào.*ngày") ||
          pattern.source.includes("vào")
        ) {
          // "vào ngày DD/MM" hoặc "vào DD/MM"
          const day = parseInt(match[1]);
          const month = parseInt(match[2]);
          if (this.isValidDate(day, month, currentYear)) {
            return `${day.toString().padStart(2, "0")}/${month
              .toString()
              .padStart(2, "0")}/${currentYear}`;
          }
        } else if (match[3]) {
          // DD/MM/YYYY hoặc DD-MM-YYYY
          const day = parseInt(match[1]);
          const month = parseInt(match[2]);
          const year = parseInt(match[3]);
          if (this.isValidDate(day, month, year)) {
            return `${day.toString().padStart(2, "0")}/${month
              .toString()
              .padStart(2, "0")}/${year}`;
          }
        } else if (match[2]) {
          // DD/MM hoặc DD-MM (năm hiện tại)
          const day = parseInt(match[1]);
          const month = parseInt(match[2]);
          if (this.isValidDate(day, month, currentYear)) {
            return `${day.toString().padStart(2, "0")}/${month
              .toString()
              .padStart(2, "0")}/${currentYear}`;
          }
        }
      }
    }

    // Xử lý các ngày tương đối - MỞ RỘNG
    if (cleanText.includes("hôm nay")) {
      return `${currentDay.toString().padStart(2, "0")}/${currentMonth
        .toString()
        .padStart(2, "0")}/${currentYear}`;
    }

    if (cleanText.includes("ngày mai")) {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return `${tomorrow.getDate().toString().padStart(2, "0")}/${(
        tomorrow.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${tomorrow.getFullYear()}`;
    }

    if (cleanText.includes("ngày kia")) {
      const dayAfterTomorrow = new Date(
        now.getTime() + 2 * 24 * 60 * 60 * 1000
      );
      return `${dayAfterTomorrow.getDate().toString().padStart(2, "0")}/${(
        dayAfterTomorrow.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${dayAfterTomorrow.getFullYear()}`;
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

    if (cleanText.includes("giữa tháng") && targetMonth) {
      return `15/${targetMonth.toString().padStart(2, "0")}/${targetYear}`;
    }

    // Nếu có tháng thì tạo ngày cuối tháng
    if (targetMonth && targetMonth >= 1 && targetMonth <= 12) {
      const lastDay = new Date(targetYear, targetMonth, 0).getDate();
      return `${lastDay}/${targetMonth
        .toString()
        .padStart(2, "0")}/${targetYear}`;
    }

    // Fallback patterns cho tuần
    if (cleanText.includes("tuần sau") || cleanText.includes("tuần tới")) {
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return `${nextWeek.getDate().toString().padStart(2, "0")}/${(
        nextWeek.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${nextWeek.getFullYear()}`;
    }

    if (cleanText.includes("tháng sau") || cleanText.includes("tháng tới")) {
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      const lastDay = new Date(nextYear, nextMonth, 0).getDate();
      return `${lastDay}/${nextMonth.toString().padStart(2, "0")}/${nextYear}`;
    }

    return null;
  }

  // Helper function để validate ngày tháng
  isValidDate(day, month, year) {
    if (month < 1 || month > 12) return false;
    if (day < 1) return false;

    const lastDayOfMonth = new Date(year, month, 0).getDate();
    return day <= lastDayOfMonth;
  }

  // Trích xuất ngày từ transaction message - PHƯƠNG THỨC MỚI
  extractDateFromTransactionMessage(message) {
    const cleanText = message.toLowerCase().trim();

    // Tìm các pattern ngày trong transaction
    const transactionDatePatterns = [
      /vào\s*ngày\s*(\d{1,2})\/(\d{1,2})/i, // vào ngày DD/MM
      /vào\s*(\d{1,2})\/(\d{1,2})/i, // vào DD/MM
      /ngày\s*(\d{1,2})\/(\d{1,2})/i, // ngày DD/MM
      /ngày\s*(\d{1,2})(?!\d)/i, // ngày DD (không có MM, dùng tháng hiện tại)
      /(\d{1,2})\/(\d{1,2})\s*này/i, // DD/MM này
      /tháng\s*(\d{1,2})\s*ngày\s*(\d{1,2})/i, // tháng X ngày Y
    ];

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    for (const pattern of transactionDatePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        let day, month;

        if (pattern.source.includes("tháng.*ngày")) {
          // "tháng X ngày Y"
          month = parseInt(match[1]);
          day = parseInt(match[2]);
        } else if (pattern.source.includes("ngày.*(?!\\d)")) {
          // "ngày DD" (không có MM, dùng tháng hiện tại)
          day = parseInt(match[1]);
          month = currentMonth;
        } else {
          // Các patterns khác: "vào ngày DD/MM", "vào DD/MM", "ngày DD/MM"
          day = parseInt(match[1]);
          month = parseInt(match[2]);
        }

        if (this.isValidDate(day, month, currentYear)) {
          // Return as Date object cho transaction
          return new Date(currentYear, month - 1, day);
        }
      }
    }

    // Kiểm tra từ khóa tương đối
    if (cleanText.includes("hôm nay")) {
      return new Date();
    }

    if (cleanText.includes("ngày mai")) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    if (cleanText.includes("hôm qua")) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }

    // Default về hôm nay nếu không tìm thấy ngày cụ thể
    return new Date();
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

  // Thử xử lý local trước khi gọi Gemini API - CẢI TIẾN VỚI ENTITY DETECTION
  async tryLocalProcessing(message, userId) {
    const lowerMessage = message.toLowerCase().trim();

    // Patterns cho thống kê với entity detection
    const statsPatterns = [
      /(?:xem|check|kiểm tra|thống kê|tổng kết).*(thống kê|tổng|chi tiêu|thu nhập|tài chính).*(?:tháng|month)/i,
      /tổng.*chi.*tiêu.*tháng/i,
      /thu.*nhập.*tháng/i,
      /báo.*cáo.*tài.*chính/i,
      /tài.*chính.*tháng/i,
    ];

    for (const pattern of statsPatterns) {
      if (pattern.test(message)) {
        console.log("Local processing: QUICK_STATS detected");
        // Extract time filter
        const timeFilter = this.extractTimeFilterFromMessage(message);
        return await this.getQuickStatsWithFilter(userId, timeFilter);
      }
    }

    // Patterns cho tạo tài khoản mới - KIỂM TRA TRƯỚC VIEW_ACCOUNTS
    const addAccountPatterns = [
      /(?:tạo|thêm|mở).*(?:tài khoản|account|ví)/i, // Thêm "ví" vào pattern chính
      /(?:tạo|thêm|mở).*(?:tài khoản|account|ví).*(?:mới|new)/i,
      /(?:tạo|thêm|mở).*(?:tài khoản|account).*(?:vietcombank|bidv|techcombank|mb bank|acb|vpbank)/i,
    ];

    for (const pattern of addAccountPatterns) {
      if (pattern.test(message)) {
        console.log(
          "Local processing: ADD_ACCOUNT pattern detected, calling Gemini"
        );
        // Để Gemini xử lý ADD_ACCOUNT
        return null; // Trả về null để gọi Gemini API
      }
    }

    // Patterns cho xem tài khoản với entity detection
    const accountPatterns = [
      /(?:xem|liệt kê|danh sách).*(?:tài khoản|account|nguồn tiền)/i,
      /số.*dư.*(?:tài khoản|account)/i,
      /(?:nguồn tiền|tài khoản).*(?:vietcombank|bidv|techcombank|mb bank|acb|vpbank)/i,
    ];

    for (const pattern of accountPatterns) {
      if (pattern.test(message)) {
        console.log("Local processing: VIEW_ACCOUNTS detected");
        // Extract entities từ message
        const entities = await this.extractEntitiesFromMessage(message, userId);
        return await this.getAccountListWithFilter(userId, entities);
      }
    }

    // Patterns cho thêm giao dịch đơn giản - KIỂM TRA TRƯỚC KHI XEM GIAO DỊCH
    const addTransactionPatterns = [
      /(?:thêm|tạo|ghi|nhập).*(?:giao dịch|chi tiêu|thu nhập)/i, // thêm giao dịch
      /(?:chi|mua|thanh toán|trả)\s+(\d+[k|nghìn|triệu|tr]?)\s+(.+)/i,
      /(?:thu|nhận|lương|tiền)\s+(\d+[k|nghìn|triệu|tr]?)\s*(.*)$/i,
      /(?:thêm|tạo).*(?:chi tiêu|thu nhập).*(\d+[k|nghìn|triệu|tr]?)/i, // thêm chi tiêu X
    ];

    for (const pattern of addTransactionPatterns) {
      const match = message.match(pattern);
      if (match) {
        console.log(
          "Local processing: ADD_TRANSACTION pattern detected, calling Gemini"
        );
        // Để Gemini xử lý ADD_TRANSACTION thay vì xử lý local
        return null; // Trả về null để gọi Gemini API
      }
    }

    // Patterns cho tạo danh mục mới - KIỂM TRA TRƯỚC VIEW patterns
    const addCategoryPatterns = [
      /(?:tạo|thêm|mở).*(?:danh mục|category).*(?:mới|new)/i,
      /(?:tạo|thêm).*(?:danh mục|category)/i,
    ];

    for (const pattern of addCategoryPatterns) {
      if (pattern.test(message)) {
        console.log(
          "Local processing: ADD_CATEGORY pattern detected, calling Gemini"
        );
        // Để Gemini xử lý ADD_CATEGORY
        return null; // Trả về null để gọi Gemini API
      }
    }

    // Patterns cho tạo mục tiêu mới - KIỂM TRA TRƯỚC VIEW patterns
    const addGoalPatterns = [
      /(?:tạo|thêm|đặt).*(?:mục tiêu|goal).*(?:mới|new)/i,
      /(?:tạo|thêm|đặt).*(?:mục tiêu|goal)/i,
      /(?:tiết kiệm).*(?:mục tiêu)/i,
    ];

    for (const pattern of addGoalPatterns) {
      if (pattern.test(message)) {
        console.log(
          "Local processing: ADD_GOAL pattern detected, calling Gemini"
        );
        // Để Gemini xử lý ADD_GOAL
        return null; // Trả về null để gọi Gemini API
      }
    }

    // Patterns cho xem giao dịch với entity detection - SAU KHI KIỂM TRA ADD_TRANSACTION
    const transactionPatterns = [
      /(?:xem|liệt kê|danh sách|hiển thị).*(?:giao dịch|transaction)/i, // Thêm "hiển thị"
      /giao.*dịch.*(?:ăn uống|xăng xe|mua sắm|giải trí)/i,
      /(?:xem|liệt kê).*(?:chi tiêu|thu nhập).*(?:tháng|tuần)/i, // Thêm "xem" hoặc "liệt kê"
    ];

    for (const pattern of transactionPatterns) {
      if (pattern.test(message)) {
        console.log("Local processing: VIEW_TRANSACTIONS detected");
        const entities = await this.extractEntitiesFromMessage(message, userId);
        return await this.getTransactionsWithFilter(
          userId,
          entities,
          "Tôi sẽ xem giao dịch phù hợp cho bạn."
        );
      }
    }

    // Patterns cho xem danh mục
    const categoryPatterns = [
      /(?:xem|liệt kê|danh sách).*(?:danh mục|category)/i,
      /danh.*mục.*(?:chi tiêu|thu nhập)/i,
    ];

    for (const pattern of categoryPatterns) {
      if (pattern.test(message)) {
        console.log("Local processing: VIEW_CATEGORIES detected");
        const entities = await this.extractEntitiesFromMessage(message, userId);
        return await this.getCategoryListWithFilter(userId, entities);
      }
    }

    // Patterns cho xem mục tiêu
    const goalPatterns = [
      /(?:xem|liệt kê|danh sách).*(?:mục tiêu|goal)/i,
      /mục.*tiêu.*của.*tôi/i,
      /tiết.*kiệm.*mục tiêu/i,
      /mục.*tiêu.*gần.*nhất/i,
      /mục.*tiêu.*sắp.*hết.*hạn/i,
      /mục.*tiêu.*quá.*hạn/i,
      /mục.*tiêu.*hoàn.*thành/i,
    ];

    for (const pattern of goalPatterns) {
      if (pattern.test(message)) {
        console.log("Local processing: VIEW_GOALS detected");
        const entities = await this.extractEntitiesFromMessage(message, userId);

        // Detect specific goal filters từ message
        if (
          lowerMessage.includes("gần nhất") ||
          lowerMessage.includes("sắp hết hạn")
        ) {
          entities.statusFilter = "nearest_deadline";
        } else if (lowerMessage.includes("quá hạn")) {
          entities.statusFilter = "overdue";
        } else if (lowerMessage.includes("hoàn thành")) {
          entities.statusFilter = "completed";
        }

        return await this.getGoalListWithFilter(userId, entities);
      }
    }

    return null; // Không xử lý được local, cần gọi Gemini
  }

  // Trích xuất entities từ message của user
  async extractEntitiesFromMessage(message, userId) {
    const entities = {
      specificAccount: null,
      bankFilter: null,
      categoryFilter: null,
      timeFilter: null,
      amountFilter: null,
      searchTerm: null,
      typeFilter: null,
      statusFilter: null,
    };

    const lowerMessage = message.toLowerCase();

    // Lấy user context để match entities
    const userContext = await this.getUserContext(userId);

    // Extract specificAccount
    for (const account of userContext.accounts) {
      if (lowerMessage.includes(account.name.toLowerCase())) {
        entities.specificAccount = account.name;
        break;
      }
    }

    // Extract bankFilter (các ngân hàng phổ biến)
    const banks = [
      "vietcombank",
      "vcb",
      "bidv",
      "techcombank",
      "tcb",
      "mb bank",
      "mbbank",
      "acb",
      "vpbank",
      "sacombank",
      "stb",
      "agribank",
      "oceanbank",
      "maritimebank",
      "vietinbank",
      "vib",
      "tpbank",
      "shb",
      "kienlongbank",
      "lienvietpostbank",
    ];

    for (const bank of banks) {
      if (lowerMessage.includes(bank)) {
        // Chuẩn hóa tên ngân hàng
        if (bank === "vcb") entities.bankFilter = "Vietcombank";
        else if (bank === "tcb") entities.bankFilter = "Techcombank";
        else if (bank === "mbbank") entities.bankFilter = "MB Bank";
        else entities.bankFilter = bank.charAt(0).toUpperCase() + bank.slice(1);
        break;
      }
    }

    // Extract categoryFilter
    for (const category of userContext.categories) {
      if (lowerMessage.includes(category.name.toLowerCase())) {
        entities.categoryFilter = category.name;
        break;
      }
    }

    // Extract timeFilter
    entities.timeFilter = this.extractTimeFilterFromMessage(message);

    // Extract amountFilter
    const amountPatterns = [
      /trên\s*(\d+(?:\.\d+)?)\s*(?:triệu|tr|k|nghìn)?/i,
      /dưới\s*(\d+(?:\.\d+)?)\s*(?:triệu|tr|k|nghìn)?/i,
      /từ\s*(\d+(?:\.\d+)?)\s*đến\s*(\d+(?:\.\d+)?)\s*(?:triệu|tr|k|nghìn)?/i,
    ];

    for (const pattern of amountPatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        entities.amountFilter = match[0];
        break;
      }
    }

    // Extract typeFilter
    if (lowerMessage.includes("chi tiêu") || lowerMessage.includes("chi phí")) {
      entities.typeFilter = "CHITIEU";
    } else if (
      lowerMessage.includes("thu nhập") ||
      lowerMessage.includes("thu")
    ) {
      entities.typeFilter = "THUNHAP";
    }

    // Extract statusFilter cho goals
    if (
      lowerMessage.includes("hoàn thành") ||
      lowerMessage.includes("đã xong")
    ) {
      entities.statusFilter = "completed";
    } else if (
      lowerMessage.includes("quá hạn") ||
      lowerMessage.includes("trễ hạn")
    ) {
      entities.statusFilter = "overdue";
    }

    console.log("=== EXTRACTED ENTITIES ===");
    console.log(JSON.stringify(entities, null, 2));
    console.log("=== END EXTRACTED ENTITIES ===");

    return entities;
  }

  // Trích xuất time filter từ message
  extractTimeFilterFromMessage(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("tháng này")) return "tháng này";
    if (lowerMessage.includes("tháng trước")) return "tháng trước";
    if (lowerMessage.includes("tuần này")) return "tuần này";
    if (lowerMessage.includes("hôm nay")) return "hôm nay";

    // Extract "tháng X"
    const monthMatch = lowerMessage.match(/tháng\s*(\d+)/);
    if (monthMatch) {
      return `tháng ${monthMatch[1]}`;
    }

    return null;
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

  // --- PHƯƠNG PHÁP TỐI ƯU: Sử dụng System Instructions & Chat History ---
  getSystemInstructions() {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    return `Bạn là AI assistant tài chính Việt Nam. Trả về JSON thuần túy theo format:

{
  "intent": "ADD_ACCOUNT|QUICK_STATS|ADD_TRANSACTION|ADD_CATEGORY|ADD_GOAL|VIEW_ACCOUNTS|QUERY_TRANSACTIONS|UNKNOWN",
  "transaction": null hoặc {"name":"...","amount":số,"type":"CHITIEU|THUNHAP","accountGuess":"...","categoryGuess":"..."},
  "category": null hoặc {"name":"...","type":"CHITIEU|THUNHAP"},
  "account": null hoặc {"name":"...","type":"TIENMAT|THENGANHANG","bankName":"...","accountNumber":"..."},
  "goal": null hoặc {"name":"...","targetAmount":số,"deadline":"YYYY-MM-DD"},
  "responseForUser": "Câu trả lời ngắn gọn"
}

QUY TẮC:
- ADD_ACCOUNT: "tạo tài khoản", "thêm tài khoản", "mở tài khoản", "tạo ví" → intent "ADD_ACCOUNT"
  * Tạo account object với name, type (TIENMAT/THENGANHANG), bankName từ câu user
  * VD: "tạo tài khoản ACB" → {"name":"Tài khoản ACB","type":"THENGANHANG","bankName":"ACB","accountNumber":""}
- ADD_TRANSACTION: phải có đầy đủ name, amount, type, accountGuess, categoryGuess
  * Parse thời gian từ câu: "thêm chi tiêu cơm trưa 50k vào ngày 15/7" → transaction với đầy đủ thông tin
  * "hôm nay", "ngày mai", "hôm qua", "vào ngày DD/MM" → system sẽ tự động extract date
- ADD_GOAL: 
  * Bắt buộc phải có targetAmount và deadline
  * Parse thời gian từ user: "mục tiêu đi đà lạt 5 triệu tháng 12" → deadline: "2025-12-31"
  * "cuối năm" → "${currentYear}-12-31"
  * "tháng X" → "${currentYear}-X-30" (ngày cuối tháng)
  * "năm sau" → "${nextYear}-12-31"
  * Nếu không có thời gian trong câu thì deadline: null
- VIEW_ACCOUNTS: xem tài khoản, nguồn tiền, số dư → intent "VIEW_ACCOUNTS"
- QUICK_STATS: KHÔNG tự tạo số liệu, chỉ nói sẽ xem thống kê
- CHỈ trả JSON, KHÔNG markdown hay giải thích thêm

VÍ DỤ:
User: "tạo tài khoản ACB"
→ {"intent":"ADD_ACCOUNT","account":{"name":"Tài khoản ACB","type":"THENGANHANG","bankName":"ACB","accountNumber":""},"responseForUser":"Tôi sẽ tạo tài khoản ngân hàng ACB cho bạn"}

User: "thêm tài khoản Vietcombank"
→ {"intent":"ADD_ACCOUNT","account":{"name":"Tài khoản Vietcombank","type":"THENGANHANG","bankName":"Vietcombank","accountNumber":""},"responseForUser":"Tôi sẽ tạo tài khoản Vietcombank cho bạn"}

User: "tạo ví tiền mặt"
→ {"intent":"ADD_ACCOUNT","account":{"name":"Ví tiền mặt","type":"TIENMAT","bankName":"","accountNumber":""},"responseForUser":"Tôi sẽ tạo ví tiền mặt cho bạn"}

User: "thêm thu nhập thưởng tăng ca 800k vào ngày 16/7"
→ {"intent":"ADD_TRANSACTION","transaction":{"name":"Thưởng tăng ca","amount":800000,"type":"THUNHAP","accountGuess":"Ví cá nhân","categoryGuess":"Thưởng"},"responseForUser":"Đã thêm giao dịch thưởng tăng ca 800.000đ vào ngày 16/7"}

User: "mục tiêu đi du lịch 10 triệu tháng 8"
→ {"intent":"ADD_GOAL","goal":{"name":"Du lịch","targetAmount":10000000,"deadline":"2025-08-31"},"responseForUser":"Xác nhận mục tiêu du lịch 10 triệu, hạn tháng 8/2025"}

User: "xem nguồn tiền" hoặc "số dư tài khoản"
→ {"intent":"VIEW_ACCOUNTS","responseForUser":"Để tôi xem danh sách tài khoản và số dư cho bạn"}`;
  }

  // Tạo context ngắn gọn cho user hiện tại
  buildUserContext(userContext) {
    const { categories, accounts, recentTransactions, currentDate } =
      userContext;

    return `Ngày: ${currentDate}
Danh mục: ${categories
      .slice(0, 5)
      .map((c) => c.name)
      .join(", ")}${categories.length > 5 ? "..." : ""}
Tài khoản: ${accounts
      .slice(0, 3)
      .map((a) => a.name)
      .join(", ")}${accounts.length > 3 ? "..." : ""}
Giao dịch gần đây: ${recentTransactions
      .slice(0, 2)
      .map((t) => `${t.name} ${t.amount.toLocaleString()}đ`)
      .join(", ")}`;
  }

  // Gọi Gemini với system instructions tối ưu
  async callGeminiOptimized(userMessage, userContext, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Gemini API attempt ${attempt}/${retries} (optimized)`);

        // Tạo chat với system instruction đúng format
        const chat = model.startChat({
          systemInstruction: {
            parts: [{ text: this.getSystemInstructions() }],
            role: "system",
          },
          history: [], // Có thể lưu history sau này
        });

        // Context ngắn gọn
        const contextMessage = this.buildUserContext(userContext);
        const fullMessage = `Context: ${contextMessage}\n\nUser: ${userMessage}`;

        console.log("Optimized message length:", fullMessage.length);

        const result = await chat.sendMessage(fullMessage);
        console.log("Gemini API successful on attempt", attempt);
        return result;
      } catch (error) {
        console.log(`Gemini API attempt ${attempt} failed:`, error.message);

        if (attempt === retries) {
          throw error;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Helper method để lấy icon phù hợp cho category dựa trên tên và loại
  getCategoryIcon(categoryName, categoryType) {
    const name = categoryName.toLowerCase();

    // Icon mapping cho chi tiêu
    if (categoryType === "CHITIEU") {
      if (
        name.includes("ăn") ||
        name.includes("uống") ||
        name.includes("thức ăn") ||
        name.includes("đồ ăn")
      ) {
        return "fa-utensils";
      }
      if (
        name.includes("xăng") ||
        name.includes("xe") ||
        name.includes("taxi") ||
        name.includes("grab")
      ) {
        return "fa-gas-pump";
      }
      if (
        name.includes("mua sắm") ||
        name.includes("shopping") ||
        name.includes("quần áo") ||
        name.includes("đồ")
      ) {
        return "fa-shopping-bag";
      }
      if (
        name.includes("giải trí") ||
        name.includes("game") ||
        name.includes("phim") ||
        name.includes("vui chơi")
      ) {
        return "fa-gamepad";
      }
      if (
        name.includes("học") ||
        name.includes("sách") ||
        name.includes("khóa học") ||
        name.includes("học phí")
      ) {
        return "fa-graduation-cap";
      }
      if (
        name.includes("y tế") ||
        name.includes("thuốc") ||
        name.includes("bệnh viện") ||
        name.includes("khám")
      ) {
        return "fa-heartbeat";
      }
      if (
        name.includes("nhà") ||
        name.includes("thuê") ||
        name.includes("điện") ||
        name.includes("nước")
      ) {
        return "fa-home";
      }
      if (
        name.includes("quà") ||
        name.includes("tặng") ||
        name.includes("sinh nhật")
      ) {
        return "fa-gift";
      }
      if (
        name.includes("internet") ||
        name.includes("điện thoại") ||
        name.includes("vinaphone") ||
        name.includes("viettel")
      ) {
        return "fa-wifi";
      }
      if (
        name.includes("tiết kiệm") ||
        name.includes("gửi") ||
        name.includes("đầu tư")
      ) {
        return "fa-piggy-bank";
      }
      if (
        name.includes("quỹ đen") ||
        name.includes("bí mật") ||
        name.includes("cá nhân")
      ) {
        return "fa-user-secret";
      }
      if (
        name.includes("cà phê") ||
        name.includes("coffee") ||
        name.includes("trà")
      ) {
        return "fa-coffee";
      }
      if (
        name.includes("gym") ||
        name.includes("thể thao") ||
        name.includes("fitness")
      ) {
        return "fa-dumbbell";
      }
    }

    // Icon mapping cho thu nhập
    if (categoryType === "THUNHAP") {
      if (name.includes("lương") || name.includes("salary")) {
        return "fa-money-bill-wave";
      }
      if (name.includes("thưởng") || name.includes("bonus")) {
        return "fa-award";
      }
      if (
        name.includes("đầu tư") ||
        name.includes("lãi") ||
        name.includes("cổ phiếu")
      ) {
        return "fa-chart-line";
      }
      if (name.includes("bán") || name.includes("kinh doanh")) {
        return "fa-store";
      }
      if (name.includes("freelance") || name.includes("tự do")) {
        return "fa-laptop";
      }
      if (name.includes("quà") || name.includes("tặng")) {
        return "fa-gift";
      }
    }

    // Default icons
    return categoryType === "CHITIEU" ? "fa-minus-circle" : "fa-plus-circle";
  }

  // ...existing code...
}

module.exports = AIController;
