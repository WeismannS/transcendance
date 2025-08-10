import Miku from "Miku";
import { UserProfileState } from "../../../src/store/StateManager";

interface HeaderProps {
  profile: UserProfileState | null;
  onlineUsers: number;
  notifications: number;
}

export default function Header({ profile, onlineUsers, notifications }: HeaderProps) {
  return (
    <header className="relative z-10 px-6 py-4 border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">🏓</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">PingPong Pro</span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-gray-300">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm">{onlineUsers.toLocaleString()} online</span>
          </div>
          <div className="relative">
            <button className="text-gray-300 hover:text-white transition-colors">
              <span className="text-xl">🔔</span>
              {notifications > 0 && <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{notifications}</div>}
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
              {profile?.avatar && <img src={`http://localhost:3002/${profile.avatar}`} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />}
            </div>
            <span className="text-white font-semibold">{profile?.displayName || "John Doe"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
