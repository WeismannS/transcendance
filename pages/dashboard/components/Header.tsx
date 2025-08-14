import { useState } from "Miku";
import Miku from "Miku";
import { UserProfileState } from "../../../src/store/StateManager.ts";
import { API_URL } from "../../../src/services/api.ts";

interface HeaderProps {
  profile: UserProfileState | null;
  onlineUsers: number;
  notifications: number;
  onLogout?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

export default function Header({ profile, onlineUsers, notifications, onLogout, onProfileClick, onSettingsClick }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleProfileClick = () => {
    setDropdownOpen(false);
    onProfileClick?.();
  };

  const handleSettingsClick = () => {
    setDropdownOpen(false);
    onSettingsClick?.();
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    onLogout?.();
  };

  return (
    <header className="relative z-50 px-6 py-4 border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">🏓</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">PingPong Pro</span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-gray-300">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span className="text-sm">{onlineUsers.toLocaleString()} online</span>
          </div>
          <div className="relative">
            <button className="text-gray-300 hover:text-white transition-colors">
              <span className="text-xl">🔔</span>
              {notifications > 0 && <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{notifications}</div>}
            </button>
          </div>
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 hover:bg-indigo-800/30 rounded-lg px-2 py-1 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                {profile?.avatar ? (
                  <img src={API_URL + '/' + profile.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-sm">👤</span>
                )}
              </div>
              <span className="text-white font-semibold">{profile?.displayName || "John Doe"}</span>
              <svg 
                className={`w-4 h-4 text-purple-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {dropdownOpen && (
              <>
                {/* Overlay to close dropdown when clicking outside */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-indigo-500/30 z-50">
                  <div className="py-1">
                    <button
                      onClick={handleProfileClick}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-indigo-600/20 hover:text-purple-300 transition-colors flex items-center space-x-2"
                    >
                      <span>👤</span>
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={handleSettingsClick}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-indigo-600/20 hover:text-purple-300 transition-colors flex items-center space-x-2"
                    >
                      <span>⚙️</span>
                      <span>Settings</span>
                    </button>
                    <hr className="border-indigo-500/30 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-colors flex items-center space-x-2"
                    >
                      <span>🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}