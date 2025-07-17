// Test check system instructions
const axios = require("axios");

async function testSystemInstructions() {
  console.log("🔍 Testing System Instructions...\n");

  try {
    // Login với user test
    const loginResponse = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        username: "test",
        password: "123",
      }
    );

    const token = loginResponse.data.token;
    console.log("✅ Login successful\n");

    // Test với message ADD_ACCOUNT
    console.log("📝 Testing: 'tạo tài khoản acb'");

    const response = await axios.post(
      "http://localhost:5000/api/ai-assistant",
      {
        message: "tạo tài khoản acb",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📊 Response:", response.data);
  } catch (error) {
    console.log("❌ Error:", error.response?.data || error.message);
  }
}

testSystemInstructions();
