// src/api/aiService.js
import axiosInstance from "./axiosConfig";
import { addTransaction } from "./transactionsService";
import { addCategory } from "./categoriesService";
import { createGoal } from "./goalService";
import { getAccounts } from "./accountsService";

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

  // Tạo giao dịch tự động thông qua AI - sử dụng transactionsService
  async createTransactionFromAI(transactionData) {
    try {
      // Resolve account and category từ guess
      const account = await this.resolveAccount(transactionData.accountGuess);
      const category = await this.resolveCategory(
        transactionData.categoryGuess,
        transactionData.type
      );

      // Nếu không tìm được account hoặc category, fallback to AI endpoint
      if (!account || !category) {
        console.log("Cannot resolve account/category, using AI endpoint...");
        const response = await axiosInstance.post(
          "/ai-assistant/create-transaction",
          {
            amount: transactionData.amount,
            type: transactionData.type === "CHITIEU" ? "expense" : "income",
            name: transactionData.name,
            description: transactionData.name || transactionData.note,
            categoryGuess: transactionData.categoryGuess,
            accountGuess: transactionData.accountGuess,
          }
        );
        return response.data;
      }

      // Convert AI data format to transaction service format
      const transactionPayload = {
        name: transactionData.name,
        amount: transactionData.amount,
        type: transactionData.type, // CHITIEU hoặc THUNHAP
        categoryId: category._id,
        accountId: account._id,
        date: new Date(),
        note: transactionData.description || transactionData.name,
      };

      console.log(
        "Creating transaction with resolved data:",
        transactionPayload
      );

      // Sử dụng transactionsService để tạo giao dịch
      const response = await addTransaction(transactionPayload);
      return {
        success: true,
        message: "Giao dịch đã được tạo thành công",
        transaction: response.data,
      };
    } catch (error) {
      console.error("Error creating transaction from AI:", error);

      // Fallback to AI endpoint nếu có lỗi
      try {
        console.log("Fallback to AI endpoint due to error...");
        const response = await axiosInstance.post(
          "/ai-assistant/create-transaction",
          {
            amount: transactionData.amount,
            type: transactionData.type === "CHITIEU" ? "expense" : "income",
            name: transactionData.name,
            description: transactionData.name || transactionData.note,
            categoryGuess: transactionData.categoryGuess,
            accountGuess: transactionData.accountGuess,
          }
        );
        return response.data;
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        throw error;
      }
    }
  }

  // Tạo danh mục tự động thông qua AI - sử dụng categoriesService
  async createCategoryFromAI(categoryData) {
    try {
      // Convert AI data format to category service format
      const categoryPayload = {
        name: categoryData.name,
        type: categoryData.type, // CHITIEU hoặc THUNHAP
        budget: categoryData.budget || 0,
        description: categoryData.description || "",
        icon: categoryData.icon || "fa-question-circle",
      };

      console.log("Creating category with data:", categoryPayload);

      // Sử dụng categoriesService để tạo danh mục
      const response = await addCategory(categoryPayload);
      return {
        success: true,
        message: "Danh mục đã được tạo thành công",
        category: response.data,
      };
    } catch (error) {
      console.error("Error creating category from AI:", error);

      // Fallback to AI endpoint nếu có lỗi
      try {
        console.log("Fallback to AI endpoint due to error...");
        const response = await axiosInstance.post(
          "/ai-assistant/create-category",
          categoryData
        );
        return response.data;
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        throw error;
      }
    }
  }

  // Tạo mục tiêu tự động thông qua AI - sử dụng goalService
  async createGoalFromAI(goalData) {
    try {
      // Convert deadline format properly
      let deadlineDate = null;
      if (goalData.deadline) {
        if (goalData.deadline.includes("/")) {
          // DD/MM/YYYY format from backend
          const parts = goalData.deadline.split("/");
          if (parts.length === 3) {
            deadlineDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        } else if (goalData.deadline.includes("-")) {
          // YYYY-MM-DD format
          deadlineDate = new Date(goalData.deadline);
        } else {
          deadlineDate = new Date(goalData.deadline);
        }
      }

      // Convert AI data format to goal service format
      const goalPayload = {
        name: goalData.name,
        targetAmount: goalData.targetAmount,
        deadline:
          deadlineDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
        description: goalData.description || "",
      };

      console.log("Creating goal with data:", goalPayload);
      console.log("Original deadline:", goalData.deadline);
      console.log("Converted deadline:", deadlineDate);

      // Sử dụng goalService để tạo mục tiêu
      const response = await createGoal(goalPayload);
      return {
        success: true,
        message: "Mục tiêu đã được tạo thành công",
        goal: response.data,
      };
    } catch (error) {
      console.error("Error creating goal from AI:", error);

      // Fallback to AI endpoint nếu có lỗi
      try {
        console.log("Fallback to AI endpoint due to error...");
        const response = await axiosInstance.post(
          "/ai-assistant/create-goal",
          goalData
        );
        return response.data;
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        throw error;
      }
    }
  }

  // Helper method để resolve account từ accountGuess
  async resolveAccount(accountGuess) {
    try {
      if (!accountGuess) return null;

      const accounts = await getAccounts({});
      const foundAccount = accounts.find((account) =>
        account.name.toLowerCase().includes(accountGuess.toLowerCase())
      );

      return foundAccount || accounts[0]; // Fallback to first account
    } catch (error) {
      console.error("Error resolving account:", error);
      return null;
    }
  }

  // Helper method để resolve category từ categoryGuess
  async resolveCategory(categoryGuess, transactionType) {
    try {
      if (!categoryGuess) return null;

      const { getCategories } = await import("./categoriesService");
      const categories = await getCategories({ type: transactionType });
      const foundCategory = categories.find((category) =>
        category.name.toLowerCase().includes(categoryGuess.toLowerCase())
      );

      return foundCategory;
    } catch (error) {
      console.error("Error resolving category:", error);
      return null;
    }
  }
}

export default new AIService();
