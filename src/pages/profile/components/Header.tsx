import Miku from "Miku"
import { Link } from "Miku/Router"

export default function Header() {
  return (
    <header className="relative z-10 px-6 py-4 border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">🏓</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
            PingPong Pro
          </span>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/home" className="text-gray-300 hover:text-white transition-colors">
            Home
          </Link>
          <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link to="/tournaments" className="text-gray-300 hover:text-white transition-colors">
            Tournaments
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">JD</span>
          </div>
          <span className="text-white font-semibold">John Doe</span>
        </div>
      </div>
    </header>
  )
}
