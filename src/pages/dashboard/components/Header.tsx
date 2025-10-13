import { useState } from "../../../Miku/src/index";
import Miku from "../../../Miku/src/index";
import { UserProfileState } from "../../../store/StateManager.ts";
import { API_URL } from "../../../services/api.ts";
import { Link } from "../../../Miku/src/Router/Router";
interface HeaderProps {
  profile: UserProfileState | null;
  onlineUsers: number;
  notifications: number;
  onLogout?: () => void;
  onProfileClick?: () => void;
}

export default function Header({ profile, onlineUsers, notifications, onLogout, onProfileClick }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleProfileClick = () => {
    setDropdownOpen(false);
    onProfileClick?.();
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    onLogout?.();
  };

  return (
    <header className="relative z-50 px-6 py-4 border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">🏓</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">PingPong Pro</span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-gray-300">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-sm">{onlineUsers.toLocaleString()} online</span>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 hover:bg-cyan-800/30 rounded-lg px-2 py-1 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                {profile?.avatar ? (
                  <img src={API_URL + '/' + profile.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-sm">👤</span>
                )}
              </div>
              <span className="text-white font-semibold">{profile?.displayName || "John Doe"}</span>
              <svg 
                className={`w-4 h-4 text-cyan-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
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
                <div className="absolute right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-cyan-500/30 z-50">
                  <div className="py-1">
                    <Link
                      to={"/profile/" + profile?.displayName}
                      onClick={handleProfileClick}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-cyan-600/20 hover:text-cyan-300 transition-colors flex items-center space-x-2"
                    >
                      <span>👤</span>
                      <span>Profile</span>
                    </Link>
                    <hr className="border-cyan-500/30 my-1" />
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