import Miku, { useState } from "Miku"
import { Link } from "Miku/Router"
import { stateManager } from "../store/StateManager.ts"
import { UserProfileState, SocialState, NotificationsState } from "../store/StateManager.ts"
import { API_URL, logOut } from "../services/api.ts"
import { redirect } from "Miku/Router"

interface UniversalHeaderProps {
  currentPage?: string
  showOnlineUsers?: boolean
  showNotifications?: boolean
  showUserProfile?: boolean
}

export default function UniversalHeader({ 
  currentPage = "", 
  showOnlineUsers = true, 
  showNotifications = true,
  showUserProfile = true 
}: UniversalHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Get user data from state manager
  const userProfile = stateManager.getState<UserProfileState>('userProfile')
  const socialState = stateManager.getState<SocialState>('social')
  const notificationsState = stateManager.getState<NotificationsState>('notifications')

  const handleProfileClick = () => {
    setDropdownOpen(false)
    redirect('/app_home')
  }

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logOut()
  }

  const handleNavigation = (path: string) => {
    setMobileMenuOpen(false)
    redirect(path)
  }

  const navigationItems = [
    { label: "Dashboard", path: "/dashboard", icon: "🏠" },
    { label: "Profile", path: "/app_home", icon: "👤" },
    { label: "Game", path: "/game", icon: "🏓" },
    { label: "Tournaments", path: "/tournaments", icon: "🏆" },
    { label: "Leaderboard", path: "/leaderboard", icon: "📊" },
  ]

  const isActivePage = (path: string) => {
    if (currentPage === "profile" && (path === "/app_home" || path.startsWith("/profile"))) return true
    if (currentPage === "dashboard" && path === "/dashboard") return true
    if (currentPage === "game" && path === "/game") return true
    if (currentPage === "tournaments" && path === "/tournaments") return true
    if (currentPage === "leaderboard" && path === "/leaderboard") return true
    return false
  }

  return (
    <header className="relative z-50 px-6 py-4 border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">🏓</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              PingPong Pro
            </span>
            {currentPage && (
              <span className="text-xs text-gray-400 capitalize -mt-1">
                {currentPage}
              </span>
            )}
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                isActivePage(item.path)
                  ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg transform scale-105"
                  : "text-gray-300 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {/* Online Users (only if enabled and data available) */}
          {showOnlineUsers && socialState?.onlineUsers && (
            <div className="hidden sm:flex items-center space-x-2 text-gray-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">{socialState.onlineUsers.toLocaleString()} online</span>
            </div>
          )}

          {/* Notifications (only if enabled and user is logged in) */}
          {showNotifications && userProfile && (
            <div className="relative">
              <button 
                onClick={() => redirect('/dashboard')}
                className="text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700/50"
              >
                <span className="text-xl">🔔</span>
                {notificationsState?.unreadCount && notificationsState.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {notificationsState.unreadCount > 99 ? '99+' : notificationsState.unreadCount}
                  </div>
                )}
              </button>
            </div>
          )}

          {/* User Profile (only if enabled and user is logged in) */}
          {showUserProfile && userProfile && (
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-3 hover:bg-gray-700/50 rounded-xl px-3 py-2 transition-all"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                  {userProfile.avatar ? (
                    <img 
                      src={`${API_URL}/${userProfile.avatar}`} 
                      alt={userProfile.displayName}
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {userProfile.displayName?.split(" ").map(n => n[0]).join("") || "U"}
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-white font-semibold text-sm">
                    {userProfile.displayName || "User"}
                  </span>
                  <span className="text-gray-400 text-xs">
                    Online
                  </span>
                </div>
                <svg 
                  className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {dropdownOpen && (
                <>
                  {/* Overlay to close dropdown */}
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 z-50">
                    <div className="py-2">
                      <button
                        onClick={handleProfileClick}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-orange-500/20 hover:text-orange-300 transition-colors flex items-center space-x-3"
                      >
                        <span className="text-lg">👤</span>
                        <div>
                          <div className="font-medium">View Profile</div>
                          <div className="text-xs text-gray-500">Manage your profile</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setDropdownOpen(false)
                          redirect('/dashboard')
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-purple-500/20 hover:text-purple-300 transition-colors flex items-center space-x-3"
                      >
                        <span className="text-lg">⚙️</span>
                        <div>
                          <div className="font-medium">Settings</div>
                          <div className="text-xs text-gray-500">Preferences & account</div>
                        </div>
                      </button>
                      <hr className="border-gray-700 my-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors flex items-center space-x-3"
                      >
                        <span className="text-lg">🚪</span>
                        <div>
                          <div className="font-medium">Sign Out</div>
                          <div className="text-xs text-red-500">See you later!</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <>
          {/* Mobile overlay */}
          <div 
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Mobile menu */}
          <div className="absolute top-full left-0 right-0 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 lg:hidden z-50">
            <div className="px-6 py-4 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center space-x-3 ${
                    isActivePage(item.path)
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              
              {/* Mobile user info */}
              {userProfile && (
                <div className="pt-4 mt-4 border-t border-gray-700">
                  <div className="flex items-center space-x-3 px-4 py-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                      {userProfile.avatar ? (
                        <img 
                          src={`${API_URL}/${userProfile.avatar}`} 
                          alt={userProfile.displayName}
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-white font-bold">
                          {userProfile.displayName?.split(" ").map(n => n[0]).join("") || "U"}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{userProfile.displayName || "User"}</div>
                      <div className="text-gray-400 text-sm">Online</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleLogout()
                    }}
                    className="w-full text-left px-4 py-3 text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-xl transition-colors flex items-center space-x-3 mt-2"
                  >
                    <span className="text-lg">🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  )
}
