// Test script đơn giản để kiểm tra AI pattern recognition
const AIController = require("./controllers/aiController");

async function testAIPatterns() {
  console.log("🧪 Testing AI Pattern Recognition...\n");

  const aiController = new AIController();
  const testMessages = [
    "tạo tài khoản acb",
    "thêm tài khoản Vietcombank",
    "mở tài khoản mới",
    "tạo ví tiền mặt",
    "xem tài khoản acb",
    "chi tiêu 50k ăn uống",
    "xem thống kê tháng này",
  ];

  for (const message of testMessages) {
    console.log(`📝 Testing: "${message}"`);

    try {
      const result = await aiController.tryLocalProcessing(
        message,
        "test-user-id"
      );
      if (result) {
        console.log(`✅ Intent: ${result.intent}`);
        if (result.account) {
          console.log(`🏦 Account: ${JSON.stringify(result.account)}`);
        }
      } else {
        console.log("❌ No local pattern match - would call Gemini");
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    console.log("---");
  }
}

testAIPatterns();
