"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/client/hooks/useAuth";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock notifications for now - in a real app, this would fetch from an API
  useEffect(() => {
    if (user) {
      // Simulate loading notifications
      setLoading(true);
      setTimeout(() => {
        setNotifications([
          {
            id: "1",
            title: "Welcome to metacx",
            message: "Your account has been successfully created!",
            type: "success",
            read: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          },
          {
            id: "2",
            title: "Organization Updated",
            message: "Your organization settings have been updated.",
            type: "info",
            read: false,
            createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            actionUrl: "/organizations",
          },
          {
            id: "3",
            title: "New Member Joined",
            message: "John Doe has joined your organization.",
            type: "info",
            read: true,
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          },
        ]);
        setLoading(false);
      }, 500);
    }
  }, [user]);

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== notificationId)
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
