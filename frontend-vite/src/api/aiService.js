// src/api/aiService.js
import axiosInstance from "./axiosConfig";

class AIService {
  // Xử lý tin nhắn từ người dùng và trả về phản hồi AI
  async processMessage(message) {
    try {
      const response = await axiosInstance.post("/ai-assistant", {
        message: message.trim(),
      });
      return response.data;
    } catch (error) {
      console.error("AI Service Error:", error);
      // Fallback to offline processing if API fails
      return this.processOfflineMessage(message);
    }
  }

  // Phân tích intent từ tin nhắn người dùng
  analyzeIntent(message) {
    const lowerMessage = message.toLowerCase();

    // Intent patterns
    const patterns = {
      ADD_TRANSACTION: [
        /thêm.*giao dịch/i,
        /chi.*tiêu/i,
        /thu.*nhập/i,
        /thêm.*chi/i,
        /thêm.*thu/i,
        /giao dịch.*mới/i,
      ],
      VIEW_STATISTICS: [
        /thống kê/i,
        /xem.*tổng/i,
        /báo cáo/i,
        /chi.*tiêu.*tháng/i,
        /thu.*chi/i,
      ],
      ADD_GOAL: [/mục tiêu/i, /tiết kiệm/i, /đặt.*mục tiêu/i, /tạo.*mục tiêu/i],
      ADD_ACCOUNT: [/thêm.*tài khoản/i, /tài khoản.*mới/i, /tạo.*tài khoản/i],
      ADD_CATEGORY: [
        /thêm.*danh mục/i,
        /danh mục.*mới/i,
        /tạo.*danh mục/i,
        /category/i,
      ],
      VIEW_TRANSACTIONS: [
        /xem.*giao dịch/i,
        /lịch sử.*giao dịch/i,
        /danh sách.*giao dịch/i,
      ],
    };

    for (const [intent, patternList] of Object.entries(patterns)) {
      for (const pattern of patternList) {
        if (pattern.test(lowerMessage)) {
          return intent;
        }
      }
    }

    return "GENERAL_QUERY";
  }

  // Trích xuất thông tin từ tin nhắn
  extractInformation(message, intent) {
    const info = {};

    switch (intent) {
      case "ADD_TRANSACTION": {
        // Trích xuất số tiền
        const amountMatch = message.match(
          /(\d+(?:[.,]\d+)?)\s*(?:k|nghìn|triệu|tr)?/i
        );
        if (amountMatch) {
          let amount = parseFloat(amountMatch[1].replace(",", "."));
          const unit = amountMatch[0].toLowerCase();
          if (unit.includes("k") || unit.includes("nghìn")) {
            amount *= 1000;
          } else if (unit.includes("triệu") || unit.includes("tr")) {
            amount *= 1000000;
          }
          info.amount = amount;
        }

        // Trích xuất loại giao dịch
        if (/chi.*tiêu|chi|mua|trả/i.test(message)) {
          info.type = "expense";
        } else if (/thu.*nhập|thu|nhận|lương/i.test(message)) {
          info.type = "income";
        }

        // Trích xuất danh mục
        const categories = [
          "ăn uống",
          "xăng xe",
          "mua sắm",
          "giải trí",
          "học tập",
          "y tế",
          "gia đình",
        ];
        for (const category of categories) {
          if (message.toLowerCase().includes(category)) {
            info.category = category;
            break;
          }
        }

        break;
      }

      case "ADD_GOAL": {
        // Trích xuất số tiền mục tiêu
        const goalAmountMatch = message.match(
          /(\d+(?:[.,]\d+)?)\s*(?:k|nghìn|triệu|tr)?/i
        );
        if (goalAmountMatch) {
          let amount = parseFloat(goalAmountMatch[1].replace(",", "."));
          const unit = goalAmountMatch[0].toLowerCase();
          if (unit.includes("k") || unit.includes("nghìn")) {
            amount *= 1000;
          } else if (unit.includes("triệu") || unit.includes("tr")) {
            amount *= 1000000;
          }
          info.targetAmount = amount;
        }
        break;
      }
    }

    return info;
  }

  // Tạo phản hồi dựa trên intent và thông tin
  generateResponse(intent, extractedInfo) {
    switch (intent) {
      case "ADD_TRANSACTION":
        if (extractedInfo.amount) {
          return {
            response: `Tôi sẽ giúp bạn thêm giao dịch ${extractedInfo.type === "expense" ? "chi tiêu" : "thu nhập"} ${extractedInfo.amount.toLocaleString()}đ${extractedInfo.category ? ` cho ${extractedInfo.category}` : ""}. Bạn có muốn tôi thực hiện không?`,
            action: "ADD_TRANSACTION",
            data: extractedInfo,
          };
        } else {
          return {
            response:
              'Tôi cần thêm thông tin về số tiền. Bạn có thể nói rõ hơn không? Ví dụ: "Thêm chi tiêu 50k cho ăn uống"',
            action: "REQUEST_MORE_INFO",
          };
        }

      case "VIEW_STATISTICS":
        return {
          response:
            "Tôi sẽ chuyển bạn đến trang thống kê để xem báo cáo chi tiết về thu chi.",
          action: "NAVIGATE",
          data: { path: "/statistics" },
        };

      case "ADD_GOAL":
        if (extractedInfo.targetAmount) {
          return {
            response: `Tôi sẽ giúp bạn tạo mục tiêu tiết kiệm ${extractedInfo.targetAmount.toLocaleString()}đ. Bạn có muốn đặt thêm thông tin khác không?`,
            action: "ADD_GOAL",
            data: extractedInfo,
          };
        } else {
          return {
            response:
              'Bạn muốn đặt mục tiêu tiết kiệm bao nhiều tiền? Ví dụ: "Tạo mục tiêu tiết kiệm 5 triệu"',
            action: "REQUEST_MORE_INFO",
          };
        }

      case "ADD_ACCOUNT":
        return {
          response:
            "Tôi sẽ chuyển bạn đến trang quản lý tài khoản để thêm tài khoản mới.",
          action: "NAVIGATE",
          data: { path: "/accounts" },
        };

      case "ADD_CATEGORY":
        return {
          response:
            "Tôi sẽ chuyển bạn đến trang quản lý danh mục để thêm danh mục mới.",
          action: "NAVIGATE",
          data: { path: "/categories" },
        };

      case "VIEW_TRANSACTIONS":
        return {
          response:
            "Tôi sẽ chuyển bạn đến trang giao dịch để xem lịch sử chi tiết.",
          action: "NAVIGATE",
          data: { path: "/transactions" },
        };

      default:
        return {
          response:
            "Tôi có thể giúp bạn:\n• Thêm giao dịch thu/chi\n• Xem thống kê tài chính\n• Tạo mục tiêu tiết kiệm\n• Quản lý tài khoản và danh mục\n\nBạn muốn làm gì?",
          action: "SHOW_HELP",
        };
    }
  }

  // Xử lý tin nhắn offline (không cần gọi API)
  async processOfflineMessage(message) {
    const intent = this.analyzeIntent(message);
    const extractedInfo = this.extractInformation(message, intent);
    const result = this.generateResponse(intent, extractedInfo);

    return {
      success: true,
      ...result,
    };
  }

  // Tạo giao dịch tự động thông qua AI
  async createTransactionFromAI(transactionData) {
    try {
      const response = await axiosInstance.post(
        "/ai-assistant/create-transaction",
        {
          amount: transactionData.amount,
          type: transactionData.type === "CHITIEU" ? "expense" : "income",
          category: transactionData.categoryGuess,
          description: transactionData.name || transactionData.note,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating transaction from AI:", error);
      throw error;
    }
  }

  // Tạo tài khoản tự động thông qua AI
  async createAccountFromAI(accountData) {
    try {
      // Convert AI data format to account service format
      const accountPayload = {
        name: accountData.name,
        type: accountData.type || "TIENMAT", // TIENMAT hoặc THENGANHANG
        bankName: accountData.bankName || null,
        accountNumber: accountData.accountNumber || "", // Thêm accountNumber
        initialBalance: accountData.initialBalance || 0,
      };

      console.log("Creating account with data:", accountPayload);

      // Gọi trực tiếp AI endpoint để tạo account
      const response = await axiosInstance.post(
        "/ai-assistant/create-account",
        accountPayload
      );
      return {
        success: true,
        message: "Tài khoản đã được tạo thành công",
        account: response.data.account || response.data,
      };
    } catch (error) {
      console.error("Error creating account from AI:", error);
      throw error;
    }
  }
}

export default new AIService();
