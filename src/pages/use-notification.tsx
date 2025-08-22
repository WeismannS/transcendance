"use client"

import { useState, useEffect, useRef } from "Miku"

export interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info" | "game_invite"
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  avatar? : string
  onAccept?: () => void
  onReject?: () => void
}

// Global notification state using a simple object
const notificationState = {
  notifications: [] as Notification[],
  listeners: [] as Array<(notifications: Notification[]) => void>,
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const listenerRef = useRef<((notifications: Notification[]) => void)>()

  useEffect(() => {
    // Create listener function
    const listener = (newNotifications: Notification[]) => {
      setNotifications([...newNotifications])
    }

    listenerRef.current = listener

    // Add listener to global state
    notificationState.listeners.push(listener)

    // Set initial state
    setNotifications([...notificationState.notifications])

    // Cleanup
    return () => {
      const index = notificationState.listeners.indexOf(listener)
      if (index > -1) {
        notificationState.listeners.splice(index, 1)
      }
    }
  }, [])

  const addNotification = (notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    }

    // Add to global state
    notificationState.notifications.push(newNotification)

    // Notify all listeners
    notificationState.listeners.forEach((listener) => {
      listener(notificationState.notifications)
    })

    // Auto remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }

  const removeNotification = (id: string) => {
    const index = notificationState.notifications.findIndex((n) => n.id === id)
    if (index > -1) {
      notificationState.notifications.splice(index, 1)

      // Notify all listeners
      notificationState.listeners.forEach((listener) => {
        listener(notificationState.notifications)
      })
    }
  }

  const clearAll = () => {
    notificationState.notifications.length = 0

    // Notify all listeners
    notificationState.listeners.forEach((listener) => {
      listener(notificationState.notifications)
    })
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  }
}
