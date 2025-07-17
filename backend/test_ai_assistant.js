// Test script để kiểm tra AI Assistant với Gemini
const axios = require("axios");

// Test data - chỉ test ADD_ACCOUNT
const testCases = [
  {
    message: "tạo tài khoản acb",
    expectedIntent: "ADD_ACCOUNT",
  },
];

async function testAIAssistant() {
  console.log("🤖 Testing AI Assistant with Google Gemini...\n");

  // Đầu tiên login để lấy token
  let token;
  try {
    console.log("🔐 Logging in to get token...");
    const loginResponse = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        username: "test",
        password: "123",
      }
    );
    token = loginResponse.data.token;
    console.log("✅ Login successful, token obtained\n");
  } catch (error) {
    console.log("❌ Login failed:", error.response?.data || error.message);
    return;
  }

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
