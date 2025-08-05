
import Miku,{ useState, useEffect } from "Miku"
import { Link } from "Miku/Router"

export default function UserProfilePage() {
  const [isVisible, setIsVisible] = useState(false)
  const [ballPosition, setBallPosition] = useState({ x: 20, y: 80 })
  const [activeTab, setActiveTab] = useState("overview")
  const [isFriend, setIsFriend] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  // Mock profile data
  const profileUser = {
    id: "alex_chen_123",
    name: "Alex Chen",
    username: "@alexchen",
    rank: 28,
    level: 34,
    wins: 234,
    losses: 156,
    winRate: 60.0,
    winStreak: 8,
    currentStreak: 8,
    bestStreak: 15,
    joinDate: "March 2023",
    country: "🇺🇸 United States",
    favoriteTable: "Classic Wood",
    playStyle: "Aggressive",
    totalMatches: 390,
    tournamentsWon: 12,
    xp: 8450,
  }

  const recentMatches = [
    {
      id: 1,
      opponent: "Maria Rodriguez",
      result: "win",
      score: "11-7, 11-9",
      time: "3 hours ago",
      duration: "12m 34s",
    },
    {
      id: 2,
      opponent: "David Kim",
      result: "win",
      score: "11-6, 9-11, 11-8",
      time: "1 day ago",
      duration: "18m 12s",
    },
    {
      id: 3,
      opponent: "Sarah Wilson",
      result: "loss",
      score: "9-11, 11-8, 8-11",
      time: "2 days ago",
      duration: "22m 45s",
    },
    {
      id: 4,
      opponent: "Mike Johnson",
      result: "win",
      score: "11-4, 11-6",
      time: "3 days ago",
      duration: "8m 56s",
    },
  ]

  const achievements = [
    { name: "Speed Demon", icon: "⚡", description: "Win 10 matches in under 10 minutes", unlocked: true },
    { name: "Tournament Master", icon: "👑", description: "Win 10 tournaments", unlocked: true },
    { name: "Comeback King", icon: "🔄", description: "Win after being 2 sets down", unlocked: true },
    { name: "Perfect Game", icon: "💎", description: "Win without losing a point", unlocked: false },
    { name: "Marathon Player", icon: "🏃", description: "Play for 5 hours straight", unlocked: true },
    { name: "Giant Slayer", icon: "⚔️", description: "Beat a top 10 player", unlocked: false },
  ]

  const tournamentHistory = [
    {
      id: 1,
      name: "World Championship 2024",
      placement: "3rd Place",
      prize: "$2,500",
      date: "2 weeks ago",
      participants: 128,
    },
    {
      id: 2,
      name: "Speed Masters",
      placement: "1st Place",
      prize: "$5,000",
      date: "1 month ago",
      participants: 64,
    },
    {
      id: 3,
      name: "Regional Cup",
      placement: "2nd Place",
      prize: "$1,500",
      date: "2 months ago",
      participants: 32,
    },
  ]

  const mutualHistory = [
    {
      id: 1,
      result: "loss",
      score: "8-11, 11-9, 9-11",
      date: "2 weeks ago",
    },
    {
      id: 2,
      result: "win",
      score: "11-6, 11-8",
      date: "1 month ago",
    },
    {
      id: 3,
      result: "loss",
      score: "9-11, 11-7, 8-11",
      date: "2 months ago",
    },
  ]

  useEffect(() => {
    setIsVisible(true)

    // Animated ping pong ball
    const ballInterval = setInterval(() => {
      setBallPosition((prev) => ({
        x: Math.random() * 70 + 15,
        y: Math.random() * 60 + 20,
      }))
    }, 4000)

    // Simulate online status changes
    const statusInterval = setInterval(() => {
      setIsOnline((prev) => Math.random() > 0.3) // 70% chance to be online
    }, 10000)

    return () => {
      clearInterval(ballInterval)
      clearInterval(statusInterval)
    }
  }, [])

  const handleFriendToggle = () => {
    setIsFriend(!isFriend)
  }

  const handleChallenge = () => {
    console.log("Challenge sent to", profileUser.name)
  }

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Stats Overview */}
      <div className="space-y-6">
        <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Performance Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-700/30 rounded-xl">
              <div className="text-2xl font-bold text-green-400">{profileUser.wins}</div>
              <div className="text-gray-400 text-sm">Wins</div>
            </div>
            <div className="text-center p-4 bg-gray-700/30 rounded-xl">
              <div className="text-2xl font-bold text-red-400">{profileUser.losses}</div>
              <div className="text-gray-400 text-sm">Losses</div>
            </div>
            <div className="text-center p-4 bg-gray-700/30 rounded-xl">
              <div className="text-2xl font-bold text-orange-400">{profileUser.winRate}%</div>
              <div className="text-gray-400 text-sm">Win Rate</div>
            </div>
            <div className="text-center p-4 bg-gray-700/30 rounded-xl">
              <div className="text-2xl font-bold text-purple-400">{profileUser.tournamentsWon}</div>
              <div className="text-gray-400 text-sm">Tournaments Won</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Streaks</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Current Streak:</span>
              <span className="text-orange-400 font-bold flex items-center">🔥 {profileUser.currentStreak} wins</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Best Streak:</span>
              <span className="text-yellow-400 font-bold">{profileUser.bestStreak} wins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Head-to-Head */}
      <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Head-to-Head vs You</h3>
        <div className="space-y-4">
          {mutualHistory.map((match) => (
            <div key={match.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${match.result === "win" ? "bg-red-500" : "bg-green-500"}`}></div>
                <div>
                  <div className="text-white font-semibold">{match.score}</div>
                  <div className="text-gray-400 text-sm">{match.date}</div>
                </div>
              </div>
              <div className={`font-semibold ${match.result === "win" ? "text-red-400" : "text-green-400"}`}>
                {match.result === "win" ? "They Won" : "You Won"}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-xl border border-orange-500/30">
          <div className="text-center">
            <div className="text-white font-semibold mb-1">Overall Record</div>
            <div className="text-orange-400 font-bold">You: 1 - 2 :{profileUser.name.split(" ")[0]}</div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderMatches = () => (
    <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-6">Recent Matches</h3>
      <div className="space-y-4">
        {recentMatches.map((match) => (
          <div
            key={match.id}
            className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className={`w-4 h-4 rounded-full ${match.result === "win" ? "bg-green-500" : "bg-red-500"}`}></div>
              <div>
                <div className="text-white font-semibold">vs {match.opponent}</div>
                <div className="text-gray-400 text-sm">{match.score}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-300">{match.duration}</div>
              <div className="text-gray-400 text-sm">{match.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderAchievements = () => (
    <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-6">Achievements</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border transition-all ${
              achievement.unlocked
                ? "bg-gradient-to-br from-orange-500/20 to-pink-500/20 border-orange-500/50"
                : "bg-gray-700/30 border-gray-600 opacity-50"
            }`}
          >
            <div className={`text-3xl mb-2 ${achievement.unlocked ? "" : "grayscale"}`}>{achievement.icon}</div>
            <h4 className={`font-semibold mb-1 ${achievement.unlocked ? "text-white" : "text-gray-400"}`}>
              {achievement.name}
            </h4>
            <p className="text-gray-400 text-sm">{achievement.description}</p>
          </div>
        ))}
      </div>
    </div>
  )

  const renderTournaments = () => (
    <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-6">Tournament History</h3>
      <div className="space-y-4">
        {tournamentHistory.map((tournament) => (
          <div
            key={tournament.id}
            className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all"
          >
            <div>
              <h4 className="text-white font-semibold">{tournament.name}</h4>
              <div className="text-gray-400 text-sm">
                {tournament.participants} participants • {tournament.date}
              </div>
            </div>
            <div className="text-right">
              <div
                className={`font-semibold ${
                  tournament.placement.includes("1st")
                    ? "text-yellow-400"
                    : tournament.placement.includes("2nd")
                      ? "text-gray-300"
                      : tournament.placement.includes("3rd")
                        ? "text-orange-400"
                        : "text-gray-400"
                }`}
              >
                {tournament.placement}
              </div>
              <div className="text-green-400 text-sm">{tournament.prize}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-cyan-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-pink-400 rounded-full animate-bounce"></div>

        {/* Animated Ping Pong Ball */}
        <div
          className="absolute w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-lg transition-all duration-4000 ease-in-out"
          style={{
            left: `${ballPosition.x}%`,
            top: `${ballPosition.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        ></div>
      </div>

      {/* Header */}
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

      {/* Main Content */}
      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div
            className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            {/* Profile Header */}
            <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 mb-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-3xl">
                        {profileUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    {isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-gray-800"></div>
                    )}
                  </div>

                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">{profileUser.name}</h1>
                    <p className="text-gray-400 mb-2">{profileUser.username}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-300">
                      <span className="flex items-center space-x-1">
                        <span>🏆</span>
                        <span>Rank #{profileUser.rank}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>⭐</span>
                        <span>Level {profileUser.level}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>📅</span>
                        <span>Joined {profileUser.joinDate}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleFriendToggle}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      isFriend ? "bg-gray-600 text-white hover:bg-gray-700" : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isFriend ? "Remove Friend" : "Add Friend"}
                  </button>
                  <button
                    onClick={handleChallenge}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl font-semibold hover:from-orange-600 hover:to-pink-600 transition-all"
                  >
                    Challenge
                  </button>
                  <button className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all">
                    Message
                  </button>
                </div>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{profileUser.country}</div>
                  <div className="text-gray-400 text-sm">Country</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{profileUser.favoriteTable}</div>
                  <div className="text-gray-400 text-sm">Favorite Table</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{profileUser.playStyle}</div>
                  <div className="text-gray-400 text-sm">Play Style</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isOnline ? "text-green-400" : "text-gray-400"}`}>
                    {isOnline ? "Online" : "Offline"}
                  </div>
                  <div className="text-gray-400 text-sm">Status</div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-2 mb-8 overflow-x-auto">
              {[
                { id: "overview", label: "Overview", icon: "📊" },
                { id: "matches", label: "Recent Matches", icon: "🏓" },
                { id: "achievements", label: "Achievements", icon: "🏆" },
                { id: "tournaments", label: "Tournaments", icon: "👑" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                      : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="transition-all duration-300">
              {activeTab === "overview" && renderOverview()}
              {activeTab === "matches" && renderMatches()}
              {activeTab === "achievements" && renderAchievements()}
              {activeTab === "tournaments" && renderTournaments()}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
