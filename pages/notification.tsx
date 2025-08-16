
import Miku, {useState,useRef, useEffect} from "Miku"
import { Notification, useNotifications } from "./use-notification.tsx"
import { Props } from "src/types/types"
import { API_URL } from "../src/services/api.ts"
const NotificationToast = ({ notification }: { notification: Notification } & Props) => {
    const [isVisible, setIsVisible] = useState(false)
    const [isLeaving, setIsLeaving] = useState(false)
    const { removeNotification } = useNotifications()
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
    useEffect(() => {
      // Trigger entrance animation
      const timer = setTimeout(() => setIsVisible(true), 50)
      return () => clearTimeout(timer)
    }, [])
  
    useEffect(() => {
      // Auto-remove timer
      if (notification.duration && notification.duration > 0) {
        timeoutRef.current = setTimeout(() => {
          handleClose()
        }, notification.duration)
      }
  
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [notification.duration])
  
    const handleClose = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
  
      setIsLeaving(true)
      setTimeout(() => {
        removeNotification(notification.id)
      }, 300)
    }
    console.info(notification.duration)
    const getIcon = () => {
      switch (notification.type) {
        case "success":
          return "✅"
        case "error":
          return "❌"
        case "warning":
          return "⚠️"
        case "info":
          return "ℹ️"
        default:
          return "ℹ️"
      }
    }
  
    const getColors = () => {
      switch (notification.type) {
        case "success":
          return "border-green-500/50 bg-green-500/10 text-green-400"
        case "error":
          return "border-red-500/50 bg-red-500/10 text-red-400"
        case "warning":
          return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
        case "info":
          return "border-blue-500/50 bg-blue-500/10 text-blue-400"
        default:
          return "border-gray-500/50 bg-gray-500/10 text-gray-400"
      }
    }
  
    return (
      <div
        className={`
          transform transition-all duration-300 ease-in-out
          ${isVisible && !isLeaving ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
          ${getColors()}
          bg-gray-800/90 backdrop-blur-lg border rounded-xl p-4 shadow-2xl
          max-w-sm w-full pointer-events-auto
        `}
      >
        <div className="flex items-start space-x-3">
          {!notification.avatar ? <div className="text-xl flex-shrink-0 mt-0.5">{getIcon()}</div> : <img src={API_URL + '/' + notification.avatar} className="flex-shrink-0 rounded-full w-6 h-6 object-cover"></img>}
  
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold text-sm">{notification.title}</h4>
            {notification.message && <p className="text-gray-300 text-sm mt-1 leading-relaxed">{notification.message}</p>}
  
            {notification.action && (
              <button
                onClick={notification.action.onClick}
                className="mt-2 text-orange-400 hover:text-orange-300 text-sm font-semibold transition-colors"
              >
                {notification.action.label}
              </button>
            )}
          </div>
  
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2">
            <span className="text-lg">×</span>
          </button>
        </div>
      </div>
    )
  }
  
  export function NotificationContainer() {
    const { notifications } = useNotifications()
  
    return (
      <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
        {notifications.map((notification) => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
      </div>
    )
  }
  