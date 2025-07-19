// Test   // Test case 1: Thành công
  try {
    console.log('✅ Test 1: Đăng ký thành công');
    const timestamp = Date.now();
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      username: `testuser_${timestamp}`,
      fullname: 'Test User',
      email: `test_${timestamp}@example.com`,
      password: 'password123'
    });
    console.log('Response:', response.data);
    console.log('Status:', response.status);
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }t registration
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function testRegistration() {
  console.log("🧪 Testing Registration API...\n");

  // Test case 1: Thành công
  try {
    console.log("✅ Test 1: Đăng ký thành công");
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      username: `testuser_${Date.now()}`,
      fullname: "Test User",
      password: "password123",
    });
    console.log("Response:", response.data);
    console.log("Status:", response.status);
  } catch (error) {
    console.log("❌ Error:", error.response?.data || error.message);
  }
  console.log("\n" + "=".repeat(50) + "\n");

  // Test case 2: Username trùng lặp
  try {
    console.log("✅ Test 2: Username trùng lặp");
    await axios.post(`${BASE_URL}/auth/register`, {
      username: "duplicate_test",
      fullname: "Test User 1",
      password: "password123",
    });

    // Đăng ký lần 2 với cùng username
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      username: "duplicate_test",
      fullname: "Test User 2",
      password: "password456",
    });
    console.log("❌ Should have failed but got:", response.data);
  } catch (error) {
    console.log("✅ Expected error:", error.response?.data);
    console.log("Status:", error.response?.status);
  }
  console.log("\n" + "=".repeat(50) + "\n");

  // Test case 3: Missing fields
  try {
    console.log("✅ Test 3: Missing required fields");
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      username: "incomplete",
      // missing fullname and password
    });
    console.log("❌ Should have failed but got:", response.data);
  } catch (error) {
    console.log("✅ Expected error:", error.response?.data);
    console.log("Status:", error.response?.status);
  }
  console.log("\n" + "=".repeat(50) + "\n");

  // Test case 4: Short password
  try {
    console.log("✅ Test 4: Short password");
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      username: `shortpass_${Date.now()}`,
      fullname: "Test User",
      password: "123", // too short
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
