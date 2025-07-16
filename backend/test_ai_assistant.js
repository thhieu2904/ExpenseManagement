// Test script để kiểm tra AI Assistant với Gemini
const axios = require("axios");

// Test data
const testCases = [
  {
    message: "Thêm chi tiêu 50k cho ăn uống",
    expectedIntent: "ADD_TRANSACTION",
  },
  {
    message: "Xem thống kê tháng này",
    expectedIntent: "QUICK_STATS",
  },
  {
    message: "Tạo mục tiêu tiết kiệm 5 triệu",
    expectedIntent: "ADD_GOAL",
  },
  {
    message: "Thu nhập 2 triệu từ lương",
    expectedIntent: "ADD_TRANSACTION",
  },
];

async function testAIAssistant() {
  console.log("🤖 Testing AI Assistant with Google Gemini...\n");

  // Đầu tiên cần login để lấy token (giả sử có user test)
  let token = "dummy-token"; // Thay bằng token thật khi test

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📝 Test ${i + 1}: "${testCase.message}"`);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/ai-assistant",
        {
          message: testCase.message,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Response:", response.data.response);
      console.log("🎯 Action:", response.data.action);
      if (response.data.data) {
        console.log("📊 Data:", JSON.stringify(response.data.data, null, 2));
      }
    } catch (error) {
      console.log("❌ Error:", error.response?.data || error.message);
    }
  }
}

// Chạy test nếu file được execute trực tiếp
if (require.main === module) {
  testAIAssistant().catch(console.error);
}

module.exports = { testAIAssistant };
