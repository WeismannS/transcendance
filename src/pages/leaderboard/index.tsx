"use client"

import Miku, { useState, useEffect } from "Miku"
import { Link } from "Miku/Router"

export default function LeaderboardPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [ballPosition, setBallPosition] = useState({ x: 80, y: 20 })
  const [activeCategory, setActiveCategory] = useState("overall")
  const [activeTimeframe, setActiveTimeframe] = useState("all-time")
  const [activeRegion, setActiveRegion] = useState("global")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentUserRank, setCurrentUserRank] = useState(42)

  // Mock leaderboard data
  const leaderboardData = [
    {
      rank: 1,
      name: "Alex Chen",
      username: "@alexchen",
      country: "🇺🇸",
      points: 2847,
      wins: 234,
      losses: 56,
      winRate: 80.7,
      streak: 15,
      level: 45,
      tournaments: 8,
      avatar: "AC",
      trend: "up",
      trendChange: 2,
    },
    {
      rank: 2,
      name: "Maria Rodriguez",
      username: "@maria_r",
      country: "🇪🇸",
      points: 2756,
      wins: 198,
      losses: 67,
      winRate: 74.7,
      streak: 8,
      level: 42,
      tournaments: 12,
      avatar: "MR",
      trend: "down",
      trendChange: -1,
    },
    {
      rank: 3,
      name: "David Kim",
      username: "@davidk",
      country: "🇰🇷",
      points: 2689,
      wins: 187,
      losses: 45,
      winRate: 80.6,
      streak: 12,
      level: 41,
      tournaments: 6,
      avatar: "DK",
      trend: "up",
      trendChange: 1,
    },
    {
      rank: 4,
      name: "Sarah Wilson",
      username: "@sarahw",
      country: "🇬🇧",
      points: 2634,
      wins: 176,
      losses: 58,
      winRate: 75.2,
      streak: 5,
      level: 39,
      tournaments: 9,
      avatar: "SW",
      trend: "same",
      trendChange: 0,
    },
    {
      rank: 5,
      name: "Mike Johnson",
      username: "@mikej",
      country: "🇨🇦",
      points: 2598,
      wins: 165,
      losses: 62,
      winRate: 72.7,
      streak: 3,
      level: 38,
      tournaments: 7,
      avatar: "MJ",
      trend: "up",
      trendChange: 3,
    },
    // Add more players including current user
    ...Array.from({ length: 45 }, (_, i) => ({
      rank: i + 6,
      name: `Player ${i + 6}`,
      username: `@player${i + 6}`,
      country: ["🇺🇸", "🇬🇧", "🇩🇪", "🇫🇷", "🇯🇵", "🇦🇺"][Math.floor(Math.random() * 6)],
      points: 2500 - i * 20,
      wins: 150 - i * 2,
      losses: 50 + i,
      winRate: Math.max(60, 80 - i * 0.5),
      streak: Math.max(0, 10 - i),
      level: Math.max(20, 37 - i),
      tournaments: Math.max(1, 8 - Math.floor(i / 5)),
      avatar: `P${i + 6}`,
      trend: ["up", "down", "same"][Math.floor(Math.random() * 3)],
      trendChange: Math.floor(Math.random() * 5) - 2,
    })),
  ]

  // Insert current user at their rank
  leaderboardData[currentUserRank - 1] = {
    rank: currentUserRank,
    name: "John Doe",
    username: "@johndoe",
    country: "🇺🇸",
    points: 2156,
    wins: 156,
    losses: 89,
    winRate: 63.7,
    streak: 5,
    level: 28,
    tournaments: 4,
    avatar: "JD",
    trend: "up",
    trendChange: 3,
    //@ts-ignore
    isCurrentUser: true,
  }

  const topPlayers = leaderboardData.slice(0, 3)
  const risingStars = leaderboardData.filter((player) => player.trend === "up" && player.trendChange >= 3).slice(0, 5)

  useEffect(() => {
    setIsVisible(true)

    // Animated ping pong ball
    const ballInterval = setInterval(() => {
      setBallPosition((prev) => ({
        x: Math.random() * 70 + 15,
        y: Math.random() * 40 + 30,
      }))
    }, 3000)

    // Simulate rank changes
    const rankInterval = setInterval(() => {
      const change = Math.floor(Math.random() * 3) - 1 // -1, 0, or 1
      setCurrentUserRank((prev) => Math.max(1, Math.min(100, prev + change)))
    }, 10000)

    return () => {
      clearInterval(ballInterval)
      clearInterval(rankInterval)
    }
  }, [])

  const filteredPlayers = leaderboardData.filter((player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getCurrentUserPosition = () => {
    //@ts-ignore
    const userIndex = filteredPlayers.findIndex((player) => player.isCurrentUser)
    if (userIndex === -1) return null
    return userIndex
  }

  const renderTopThree = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {topPlayers.map((player, index) => (
        <div
          key={player.rank}
          className={`relative bg-gray-800/50 backdrop-blur-lg border rounded-2xl p-6 text-center ${
            index === 0
              ? "border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10"
              : index === 1
                ? "border-gray-400/50 bg-gradient-to-br from-gray-400/10 to-gray-500/10"
                : "border-orange-600/50 bg-gradient-to-br from-orange-600/10 to-red-500/10"
          }`}
        >
          {/* Crown for #1 */}
          {index === 0 && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-3xl">👑</div>}

          <div className="relative mb-4">
            <div
              className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold ${
                index === 0
                  ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                  : index === 1
                    ? "bg-gradient-to-r from-gray-400 to-gray-600"
                    : "bg-gradient-to-r from-orange-600 to-red-500"
              }`}
            >
              <span className="text-white">{player.avatar}</span>
            </div>
            <div
              className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                index === 0
                  ? "bg-yellow-500 text-black"
                  : index === 1
                    ? "bg-gray-400 text-black"
                    : "bg-orange-600 text-white"
              }`}
            >
              #{player.rank}
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-1">{player.name}</h3>
          <p className="text-gray-400 text-sm mb-3">{player.username}</p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Points:</span>
              <span className="text-orange-400 font-bold">{player.points.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Win Rate:</span>
              <span className="text-green-400 font-bold">{player.winRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Streak:</span>
              <span className="text-yellow-400 font-bold">🔥 {player.streak}</span>
            </div>
          </div>

          <button className="w-full mt-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl font-semibold hover:from-orange-600 hover:to-pink-600 transition-all">
            View Profile
          </button>
        </div>
      ))}
    </div>
  )

  const renderLeaderboardTable = () => (
    <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-white">Rankings</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="px-6 py-4 text-left text-gray-300 font-semibold">Rank</th>
              <th className="px-6 py-4 text-left text-gray-300 font-semibold">Player</th>
              <th className="px-6 py-4 text-center text-gray-300 font-semibold">Points</th>
              <th className="px-6 py-4 text-center text-gray-300 font-semibold">W/L</th>
              <th className="px-6 py-4 text-center text-gray-300 font-semibold">Win Rate</th>
              <th className="px-6 py-4 text-center text-gray-300 font-semibold">Streak</th>
              <th className="px-6 py-4 text-center text-gray-300 font-semibold">Trend</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.slice(0, 50).map((player, index) => (
              <tr
                key={player.rank}
                className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-all cursor-pointer ${
                  //@ts-ignore
                  player.isCurrentUser ? "bg-gradient-to-r from-orange-500/20 to-pink-500/20 border-orange-500/50" : ""
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-lg font-bold ${
                        player.rank <= 3 ? "text-orange-400" : player.rank <= 10 ? "text-yellow-400" : "text-white"
                      }`}
                    >
                      #{player.rank}
                    </span>
            
                    {
                        //@ts-ignore
                    player.isCurrentUser && <span className="text-orange-400 text-sm">YOU</span>}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{player.avatar}</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">{player.name}</div>
                      <div className="text-gray-400 text-sm flex items-center space-x-2">
                        <span>{player.username}</span>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-center">
                  <span className="text-orange-400 font-bold">{player.points.toLocaleString()}</span>
                </td>

                <td className="px-6 py-4 text-center">
                  <div className="text-sm">
                    <span className="text-green-400">{player.wins}</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-red-400">{player.losses}</span>
                  </div>
                </td>

                <td className="px-6 py-4 text-center">
                  <span
                    className={`font-semibold ${
                      player.winRate >= 75
                        ? "text-green-400"
                        : player.winRate >= 60
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {player.winRate.toFixed(1)}%
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <span className="text-yellow-400 font-semibold">
                    {player.streak > 0 ? `🔥 ${player.streak}` : "-"}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    {player.trend === "up" ? (
                      <span className="text-green-400">↗️</span>
                    ) : player.trend === "down" ? (
                      <span className="text-red-400">↘️</span>
                    ) : (
                      <span className="text-gray-400">➡️</span>
                    )}
                    <span
                      className={`text-sm ${
                        player.trend === "up"
                          ? "text-green-400"
                          : player.trend === "down"
                            ? "text-red-400"
                            : "text-gray-400"
                      }`}
                    >
                      {player.trendChange !== 0 ? Math.abs(player.trendChange) : ""}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          className="absolute w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-lg transition-all duration-3000 ease-in-out"
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
            {/* Page Header */}
            <div className="text-center mb-8">
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                  Leaderboard
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                See where you rank among the world's best ping pong players
              </p>
            </div>

            {/* Your Rank Card */}
            <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">JD</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Your Current Rank</h3>
                    <p className="text-gray-300">Keep climbing to reach the top!</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-orange-400">#{currentUserRank}</div>
                  <div className="text-green-400 text-sm flex items-center justify-end">
                    <span>↗️ +3 this week</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: "overall", label: "Overall" },
                  { id: "tournament", label: "Tournament" },
                  { id: "casual", label: "Casual" },
                ].map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                      activeCategory === category.id
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                        : "bg-gray-800/50 text-gray-400 hover:text-white"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}

                {[
                  { id: "all-time", label: "All Time" },
                  { id: "monthly", label: "Monthly" },
                  { id: "weekly", label: "Weekly" },
                ].map((timeframe) => (
                  <button
                    key={timeframe.id}
                    onClick={() => setActiveTimeframe(timeframe.id)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                      activeTimeframe === timeframe.id
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                        : "bg-gray-800/50 text-gray-400 hover:text-white"
                    }`}
                  >
                    {timeframe.label}
                  </button>
                ))}

                {[
                  { id: "global", label: "🌍 Global" },
                  { id: "us", label: "🇺🇸 US" },
                  { id: "eu", label: "🇪🇺 EU" },
                  { id: "asia", label: "🌏 Asia" },
                ].map((region) => (
                  <button
                    key={region.id}
                    onClick={() => setActiveRegion(region.id)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                      activeRegion === region.id
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                        : "bg-gray-800/50 text-gray-400 hover:text-white"
                    }`}
                  >
                    {region.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Top 3 Players */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-2">🏆</span>
                Top Champions
              </h2>
              {renderTopThree()}
            </div>

            {/* Rising Stars */}
            {risingStars.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-2">⭐</span>
                  Rising Stars
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {risingStars.map((player) => (
                    <div
                      key={player.rank}
                      className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-xl p-4 text-center hover:border-orange-500/50 transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-white font-bold text-sm">{player.avatar}</span>
                      </div>
                      <h4 className="text-white font-semibold text-sm mb-1">{player.name}</h4>
                      <div className="text-green-400 text-xs flex items-center justify-center">
                        <span>↗️ +{player.trendChange}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Leaderboard */}
            {renderLeaderboardTable()}
          </div>
        </div>
      </main>
    </div>
  )
}
