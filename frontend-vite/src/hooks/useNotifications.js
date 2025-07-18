// src/hooks/useNotifications.js

import { useState, useEffect, useCallback } from "react";
import {
  getAllNotifications,
  getUnreadNotificationCount,
} from "../api/notificationService";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [notificationsData, countData] = await Promise.all([
        getAllNotifications(),
        getUnreadNotificationCount(),
      ]);

      setNotifications(notificationsData);
      setUnreadCount(countData);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Tự động làm mới thông báo mỗi 5 phút
  useEffect(() => {
    loadNotifications();

    const interval = setInterval(
      () => {
        loadNotifications();
      },
      5 * 60 * 1000
    ); // 5 phút

    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Làm mới thông báo khi có thay đổi chi tiêu
  const refreshNotifications = useCallback(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    loadNotifications,
  };
};
