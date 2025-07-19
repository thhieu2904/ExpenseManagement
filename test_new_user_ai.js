// Test script để kiểm tra AI Assistant với user mới (chưa có account/category)
const axios = require("axios");

const BASE_URL = "http://localhost:5000";

async function testNewUserAI() {
  try {
    console.log("=== TESTING NEW USER AI SCENARIO ===\n");

    // 1. Đăng ký user mới
    console.log("1. Creating new user...");
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: `testuser_${Date.now()}@example.com`,
      password: "123456",
      name: "Test User AI",
    });

    if (registerResponse.data.success) {
      console.log("✅ User created successfully");
    } else {
      throw new Error("Failed to create user");
    }

    // 2. Đăng nhập để lấy token
    console.log("\n2. Logging in...");
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: registerResponse.data.user.email,
      password: "123456",
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.user._id;
    console.log("✅ Logged in successfully");
    console.log("User ID:", userId);

    // 3. Kiểm tra user chưa có account/category
    console.log("\n3. Checking user data...");

    const accountsResponse = await axios.get(`${BASE_URL}/accounts`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const categoriesResponse = await axios.get(`${BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Accounts count:", accountsResponse.data.length);
    console.log("Categories count:", categoriesResponse.data.length);

    // 4. Test AI Assistant với message thêm giao dịch
    console.log("\n4. Testing AI Assistant with transaction message...");

    const aiResponse = await axios.post(
      `${BASE_URL}/ai-assistant`,
      {
        message: "Chi 50k ăn sáng",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("\n=== AI RESPONSE ===");
    console.log("Success:", aiResponse.data.success);
    console.log("Response:", aiResponse.data.response);
    console.log("Action:", aiResponse.data.action);

    if (aiResponse.data.data) {
      console.log("Data:", JSON.stringify(aiResponse.data.data, null, 2));
    }

    // 5. Nếu có confirm data, thử confirm
    if (
      aiResponse.data.action === "CONFIRM_ADD_TRANSACTION" &&
      aiResponse.data.data
    ) {
      console.log("\n5. Testing transaction confirmation...");

      try {
        const confirmResponse = await axios.post(
          `${BASE_URL}/ai-assistant/create-transaction`,
          aiResponse.data.data,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Confirm success:", confirmResponse.data.success);
        console.log("Confirm message:", confirmResponse.data.message);
      } catch (confirmError) {
        console.log("Confirm error status:", confirmError.response?.status);
        console.log(
          "Confirm error message:",
          confirmError.response?.data?.message
        );
        console.log("Confirm error code:", confirmError.response?.data?.code);
        console.log(
          "Confirm error suggestion:",
          confirmError.response?.data?.suggestion
        );

        if (confirmError.response?.data?.code === "NO_ACCOUNT_FOUND") {
          console.log("✅ Successfully caught NO_ACCOUNT_FOUND error");
        }
      }
    }

    // 6. Test AI với message tạo account
    console.log("\n6. Testing AI with create account message...");

    const accountAiResponse = await axios.post(
      `${BASE_URL}/ai-assistant`,
      {
        message: "Tạo tài khoản tiền mặt với số dư 1 triệu",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("\n=== ACCOUNT AI RESPONSE ===");
    console.log("Success:", accountAiResponse.data.success);
    console.log("Response:", accountAiResponse.data.response);
    console.log("Action:", accountAiResponse.data.action);

    if (accountAiResponse.data.data) {
      console.log(
        "Data:",
        JSON.stringify(accountAiResponse.data.data, null, 2)
      );
    }
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
  }
}

// Chạy test
testNewUserAI();
