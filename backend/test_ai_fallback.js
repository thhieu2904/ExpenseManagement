// Test script for AI Controller fallback mechanisms
// backend/test_ai_fallback.js

const AIController = require("./controllers/aiController");

async function testFallbackMechanisms() {
  const controller = new AIController();

  console.log("=== TESTING AI CONTROLLER FALLBACK MECHANISMS ===\n");

  const userId = "68682c4d4a39f68d21654dc5";

  // Test 1: Local processing for statistics
  console.log("1. Testing local statistics processing:");
  try {
    const result1 = await controller.tryLocalProcessing(
      "Xem tổng chi tiêu tháng này",
      userId
    );
    console.log("Result:", result1 ? "✅ Handled locally" : "❌ Needs Gemini");
    if (result1) {
      console.log("Response:", result1.response.substring(0, 50) + "...");
    }
  } catch (error) {
    console.log("Error:", error.message);
  }

  console.log("\n2. Testing local transaction processing:");
  try {
    const result2 = await controller.tryLocalProcessing(
      "chi 50k ăn sáng",
      userId
    );
    console.log("Result:", result2 ? "✅ Handled locally" : "❌ Needs Gemini");
    if (result2) {
      console.log("Response:", result2.response);
      console.log("Data:", result2.data);
    }
  } catch (error) {
    console.log("Error:", error.message);
  }

  console.log("\n3. Testing amount extraction:");
  const testAmounts = [
    "50k",
    "2 triệu",
    "150 nghìn",
    "1000000đ",
    "5,5 triệu",
    "invalid",
  ];

  testAmounts.forEach((text) => {
    const amount = controller.extractAmount(text);
    console.log(
      `"${text}" -> ${amount ? amount.toLocaleString() + "đ" : "null"}`
    );
  });

  console.log("\n4. Testing fallback response:");
  try {
    const result4 = await controller.handleFallbackResponse(
      "Xem thống kê tháng này",
      userId
    );
    console.log(
      "Fallback response:",
      result4.response.substring(0, 50) + "..."
    );
  } catch (error) {
    console.log("Error:", error.message);
  }

  console.log("\n=== FALLBACK TEST COMPLETED ===");
}

// Chỉ chạy nếu file này được execute trực tiếp
if (require.main === module) {
  testFallbackMechanisms().catch(console.error);
}

module.exports = { testFallbackMechanisms };
