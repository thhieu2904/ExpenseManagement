// Test trực tiếp Gemini API với message ADD_ACCOUNT
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function testGeminiAddAccount() {
  console.log("🤖 Testing Gemini API directly for ADD_ACCOUNT...\n");

  const prompt = `
Bạn là AI assistant cho ứng dụng quản lý tài chính cá nhân. Phân tích tin nhắn và trả về JSON.

INTENTS:
1. **ADD_ACCOUNT** - Thêm tài khoản mới (ngân hàng hoặc tiền mặt)
   - Entities: name, type (TIENMAT/THENGANHANG), bankName, accountNumber
   - Patterns: "tạo tài khoản", "thêm tài khoản", "mở tài khoản", "tạo ví"

VÍ DỤ:
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

QUY TẮC:
- Khi user nói "tạo tài khoản", "thêm tài khoản", "mở tài khoản" => PHẢI trả về intent: "ADD_ACCOUNT"
- Chỉ trả về JSON thuần túy, không có markdown

User: "tạo tài khoản acb"
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("📝 Raw Gemini Response:");
    console.log(text);
    console.log("\n" + "=".repeat(50));

    // Thử parse JSON
    try {
      const cleanedText = text.replace(/```json|```/g, "").trim();
      const jsonResponse = JSON.parse(cleanedText);
      console.log("✅ Parsed JSON:");
      console.log("Intent:", jsonResponse.intent);
      if (jsonResponse.account) {
        console.log("Account:", JSON.stringify(jsonResponse.account, null, 2));
      }
    } catch (parseError) {
      console.log("❌ Failed to parse JSON:", parseError.message);
    }
  } catch (error) {
    console.log("❌ Gemini API Error:", error.message);
  }
}

testGeminiAddAccount();
