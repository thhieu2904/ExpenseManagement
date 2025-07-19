// Test script để test registration
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function testRegistration() {
  console.log("🧪 Testing Registration API...\n");

  // Test case 1: Thành công với email
  try {
    console.log("✅ Test 1: Đăng ký thành công với email");
    const timestamp = Date.now();
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      username: `testuser_${timestamp}`,
      fullname: "Test User",
      email: `test_${timestamp}@example.com`,
      password: "password123",
    });
    console.log("Response:", response.data);
    console.log("Status:", response.status);
  } catch (error) {
    console.log("❌ Error:", error.response?.data || error.message);
  }
  console.log("\n" + "=".repeat(50) + "\n");

  // Test case 2: Thành công không có email
  try {
    console.log("✅ Test 2: Đăng ký thành công không có email");
    const timestamp = Date.now();
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      username: `testuser_no_email_${timestamp}`,
      fullname: "Test User No Email",
      password: "password123",
    });
    console.log("Response:", response.data);
    console.log("Status:", response.status);
  } catch (error) {
    console.log("❌ Error:", error.response?.data || error.message);
  }
  console.log("\n" + "=".repeat(50) + "\n");

  // Test case 3: Email trùng lặp
  try {
    console.log("✅ Test 3: Email trùng lặp");
    const email = "duplicate@test.com";
    await axios.post(`${BASE_URL}/auth/register`, {
      username: "user1",
      fullname: "User 1",
      email: email,
      password: "password123",
    });

    // Đăng ký lần 2 với cùng email
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      username: "user2",
      fullname: "User 2",
      email: email,
      password: "password456",
    });
    console.log("❌ Should have failed but got:", response.data);
  } catch (error) {
    console.log("✅ Expected error:", error.response?.data);
    console.log("Status:", error.response?.status);
  }

  console.log("\n🎉 Registration tests completed!");
}

// Chạy test
testRegistration().catch(console.error);
