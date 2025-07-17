// Test trực tiếp optimized Gemini
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

function getSystemInstructions() {
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

VÍ DỤ:
User: "tạo tài khoản ACB"
→ {"intent":"ADD_ACCOUNT","account":{"name":"Tài khoản ACB","type":"THENGANHANG","bankName":"ACB","accountNumber":""},"responseForUser":"Tôi sẽ tạo tài khoản ngân hàng ACB cho bạn"}`;
}

async function testOptimizedGemini() {
  console.log("🧪 Testing Optimized Gemini System Instructions...\n");

  try {
    const chat = model.startChat({
      systemInstruction: {
        parts: [{ text: getSystemInstructions() }],
        role: "system",
      },
      history: [],
    });

    const contextMessage = `Ngày: 2025-07-17
Danh mục: Tiền lương, Thưởng, Thu nhập khác, Ăn uống, Xăng xe
Tài khoản: Ví cá nhân, Tài khoản Vietcombank, Techcombank
Giao dịch gần đây: Ăn uống tổng kết tháng 800,000đ, Gửi tiết kiệm 2,500,000đ`;

    const fullMessage = `Context: ${contextMessage}\n\nUser: tạo tài khoản acb`;

    console.log("📝 Full message length:", fullMessage.length);
    console.log("📄 Full message:");
    console.log(fullMessage);
    console.log("\n" + "=".repeat(50));

    const result = await chat.sendMessage(fullMessage);
    const response = await result.response;
    const text = response.text();

    console.log("📝 Raw Gemini Response:");
    console.log(text);
    console.log("\n" + "=".repeat(50));

    // Parse JSON
    try {
      const cleanedText = text.replace(/```json|```/g, "").trim();
      const jsonResponse = JSON.parse(cleanedText);
      console.log("✅ Parsed JSON:");
      console.log("Intent:", jsonResponse.intent);
      if (jsonResponse.account) {
        console.log("Account:", JSON.stringify(jsonResponse.account, null, 2));
      }
      console.log("Response:", jsonResponse.responseForUser);
    } catch (parseError) {
      console.log("❌ Failed to parse JSON:", parseError.message);
    }
  } catch (error) {
    console.log("❌ Gemini API Error:", error.message);
  }
}

testOptimizedGemini();
