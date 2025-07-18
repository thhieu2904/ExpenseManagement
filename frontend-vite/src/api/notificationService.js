// src/api/notificationService.js

import axiosInstance from "./axiosConfig";
import { generateSpendingNotifications } from "./spendingReminderService";
import {
  isTestModeEnabled,
  getTestNotifications,
} from "../utils/testNotifications";

// Hàm lấy thông báo về mục tiêu sắp hết hạn
export const getGoalNotifications = async () => {
  try {
    const response = await axiosInstance.get("/goals", {
      params: {
        status: "in-progress",
        archived: false,
        limit: 50, // Giới hạn số lượng goals để xử lý
      },
    });

    const goals =
      response.data.goals || response.data.data || response.data || [];
    const notifications = [];
    const now = new Date();

    goals.forEach((goal) => {
      if (!goal) return;

      if (goal.deadline) {
        const deadline = new Date(goal.deadline);
        const timeDiff = deadline - now;
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        // Thông báo cho mục tiêu sắp hết hạn (trong vòng 7 ngày)
        if (daysDiff <= 7 && daysDiff > 0) {
          notifications.push({
            id: `goal_deadline_${goal._id}`,
            type: "goal_deadline",
            title: "Mục tiêu sắp hết hạn",
            message: `Mục tiêu "${goal.name}" sẽ hết hạn trong ${daysDiff} ngày`,
            priority: daysDiff <= 3 ? "high" : "medium",
            createdAt: new Date(),
            goalId: goal._id,
          });
        }

        // Thông báo cho mục tiêu đã quá hạn
        if (daysDiff <= 0) {
          notifications.push({
            id: `goal_overdue_${goal._id}`,
            type: "goal_overdue",
            title: "Mục tiêu đã quá hạn",
            message: `Mục tiêu "${goal.name}" đã quá hạn ${Math.abs(daysDiff)} ngày`,
            priority: "high",
            createdAt: new Date(),
            goalId: goal._id,
          });
        }
      }

      // Thông báo cho mục tiêu gần hoàn thành (>= 90%)
      if (goal.targetAmount && goal.currentAmount) {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        if (progress >= 90 && progress < 100) {
          notifications.push({
            id: `goal_near_complete_${goal._id}`,
            type: "goal_progress",
            title: "Mục tiêu gần hoàn thành",
            message: `Mục tiêu "${goal.name}" đã hoàn thành ${Math.round(progress)}%`,
            priority: "low",
            createdAt: new Date(),
            goalId: goal._id,
          });
        }
      }
    });

    // Sắp xếp theo độ ưu tiên và thời gian
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    notifications.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return notifications;
  } catch (error) {
    console.error("Error fetching goal notifications:", error);
    return [];
  }
};

// Hàm lấy số lượng thông báo chưa đọc
export const getUnreadNotificationCount = async () => {
  try {
    // Kiểm tra test mode
    if (isTestModeEnabled()) {
      const testNotifications = getTestNotifications();
      return testNotifications.length;
    }

    const goalNotifications = await getGoalNotifications();
    const spendingNotifications = await generateSpendingNotifications();
    const totalNotifications = [...goalNotifications, ...spendingNotifications];
    return totalNotifications.length;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
};

// Hàm lấy tất cả thông báo
export const getAllNotifications = async () => {
  try {
    // Kiểm tra test mode
    if (isTestModeEnabled()) {
      const testNotifications = getTestNotifications();
      console.log(
        "🔔 Test mode enabled - returning test notifications:",
        testNotifications.length
      );
      return testNotifications;
    }

    console.log("🔔 Loading real notifications...");
    const goalNotifications = await getGoalNotifications();
    const spendingNotifications = await generateSpendingNotifications();

    console.log("📊 Goal notifications:", goalNotifications.length);
    console.log("💰 Spending notifications:", spendingNotifications.length);

    const allNotifications = [...goalNotifications, ...spendingNotifications];

    // Sắp xếp theo độ ưu tiên và thời gian
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    allNotifications.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    console.log("🔔 Total notifications:", allNotifications.length);
    return allNotifications;
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    return [];
  }
};
