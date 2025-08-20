"use client"

import Miku, { useState, useEffect } from "Miku"
import { Link } from "Miku/Router"

export default function TournamentsPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [ballPosition, setBallPosition] = useState({ x: 75, y: 25 })
  const [activeFilter, setActiveFilter] = useState("all")
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showBracket, setShowBracket] = useState(false)

  // Mock tournament data
  const tournaments = [
    {
      id: 1,
      name: "World Championship 2024",
      status: "live",
      type: "Single Elimination",
      participants: 128,
      maxParticipants: 128,
      prize: "$50,000",
      entryFee: "$100",
      startTime: "Live Now",
      endTime: "3 days",
      description: "The ultimate ping pong championship featuring the world's best players",
      rules: "Best of 5 sets, 11 points per set",
      currentRound: "Quarter Finals",
      registered: false,
      featured: true,
      difficulty: "Professional",
      organizer: "PingPong Pro League",
    },
    {
      id: 2,
      name: "Speed Masters Blitz",
      status: "upcoming",
      type: "Round Robin",
      participants: 45,
      maxParticipants: 64,
      prize: "$10,000",
      entryFee: "$25",
      startTime: "2 hours",
      endTime: "6 hours",
      description: "Fast-paced tournament with 5-minute time limits per match",
      rules: "Best of 3 sets, 11 points per set, 5-minute time limit",
      currentRound: "Registration Open",
      registered: true,
      featured: true,
      difficulty: "Intermediate",
      organizer: "Speed League",
    },
    {
      id: 3,
      name: "Rookie League Cup",
      status: "upcoming",
      type: "Double Elimination",
      participants: 28,
      maxParticipants: 32,
      prize: "$2,000",
      entryFee: "$10",
      startTime: "Tomorrow 3:00 PM",
      endTime: "2 days",
      description: "Perfect tournament for new players to compete and learn",
      rules: "Best of 3 sets, 11 points per set",
      currentRound: "Registration Open",
      registered: false,
      featured: false,
      difficulty: "Beginner",
      organizer: "Rookie Division",
    },
    {
      id: 4,
      name: "Friday Night Fever",
      status: "completed",
      type: "Single Elimination",
      participants: 64,
      maxParticipants: 64,
      prize: "$5,000",
      entryFee: "$20",
      startTime: "Completed",
      endTime: "Last Friday",
      description: "Weekly tournament for casual competitive play",
      rules: "Best of 3 sets, 11 points per set",
      currentRound: "Tournament Complete",
      registered: true,
      featured: false,
      difficulty: "Intermediate",
      organizer: "Friday League",
      winner: "Alex Chen",
      userPlacement: "3rd Place",
    },
    {
      id: 5,
      name: "Corporate Challenge",
      status: "upcoming",
      type: "Team Tournament",
      participants: 16,
      maxParticipants: 20,
      prize: "$15,000",
      entryFee: "$200",
      startTime: "Next Week",
      endTime: "3 days",
      description: "Team-based tournament for corporate groups",
      rules: "Teams of 4, best of 5 matches per round",
      currentRound: "Team Registration",
      registered: false,
      featured: true,
      difficulty: "Mixed",
      organizer: "Corporate League",
    },
  ]

  const bracketData = {
    quarterFinals: [
      { player1: "Alex Chen", player2: "Maria Rodriguez", winner: "Alex Chen", score: "3-1" },
      { player1: "David Kim", player2: "Sarah Wilson", winner: "David Kim", score: "3-2" },
      { player1: "Mike Johnson", player2: "Emma Davis", winner: "Mike Johnson", score: "3-0" },
      { player1: "John Doe", player2: "Lisa Park", winner: "John Doe", score: "3-1" },
    ],
    semiFinals: [
      { player1: "Alex Chen", player2: "David Kim", winner: null, score: "Live" },
      { player1: "Mike Johnson", player2: "John Doe", winner: null, score: "Upcoming" },
    ],
    finals: [{ player1: "TBD", player2: "TBD", winner: null, score: "TBD" }],
  }

  useEffect(() => {
    setIsVisible(true)

    // Animated ping pong ball
    const ballInterval = setInterval(() => {
      setBallPosition((prev) => ({
        x: Math.random() * 70 + 15,
        y: Math.random() * 50 + 25,
      }))
    }, 3500)

    return () => clearInterval(ballInterval)
  }, [])

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesFilter = activeFilter === "all" || tournament.status === activeFilter
    const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleRegister = (tournamentId : string) => {
    // console.log("Registering for tournament:", tournamentId)
    // Handle registration logic
  }

  const handleUnregister = (tournamentId : string) => {
    // console.log("Unregistering from tournament:", tournamentId)
    // Handle unregistration logic
  }

  const renderTournamentCard = (tournament : any) => (
    <div
      key={tournament.id}
      className={`bg-gray-800 bg-opacity-50 backdrop-blur-lg border rounded-2xl p-6 hover:border-orange-500 hover:border-opacity-50 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
        tournament.featured ? "border-orange-500 border-opacity-30" : "border-gray-700"
      }`}
      onClick={() => setSelectedTournament(tournament)}
    >
      {tournament.featured && (
        <div className="flex items-center justify-between mb-4">
          <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            FEATURED
          </span>
          <span className="text-2xl">⭐</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex-1 pr-4">{tournament.name}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
            tournament.status === "live"
              ? "bg-red-500 bg-opacity-20 text-red-400 border border-red-500 border-opacity-30"
              : tournament.status === "upcoming"
                ? "bg-orange-500 bg-opacity-20 text-orange-400 border border-orange-500 border-opacity-30"
                : "bg-green-500 bg-opacity-20 text-green-400 border border-green-500 border-opacity-30"
          }`}
        >
          {tournament.status.toUpperCase()}
        </span>
      </div>

      <p className="text-gray-300 text-sm mb-4 line-clamp-2 min-h-10">{tournament.description}</p>

      <div className="space-y-3 mb-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Type:</span>
            <span className="text-white font-medium">{tournament.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Difficulty:</span>
            <span
              className={`font-semibold ${
                tournament.difficulty === "Beginner"
                  ? "text-green-400"
                  : tournament.difficulty === "Intermediate"
                    ? "text-orange-400"
                    : tournament.difficulty === "Professional"
                      ? "text-red-400"
                      : "text-purple-400"
              }`}
            >
              {tournament.difficulty}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Players:</span>
            <span className="text-white font-medium">
              {tournament.participants}/{tournament.maxParticipants}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Prize:</span>
            <span className="text-green-400 font-semibold">{tournament.prize}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Entry:</span>
            <span className="text-orange-400 font-medium">{tournament.entryFee}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">
              {tournament.status === "live" ? "Round:" : tournament.status === "upcoming" ? "Starts:" : "Ended:"}
            </span>
            <span className="text-white font-semibold text-right">
              {tournament.status === "live"
                ? tournament.currentRound
                : tournament.status === "upcoming"
                  ? tournament.startTime
                  : tournament.endTime}
            </span>
          </div>
        </div>
      </div>

      {tournament.status === "completed" && tournament.userPlacement && (
        <div className="mb-4 p-3 bg-gradient-to-r from-orange-500 to-pink-500 bg-opacity-20 rounded-xl border border-orange-500 border-opacity-30">
          <div className="flex justify-between items-center">
            <span className="text-white font-semibold">Your Result:</span>
            <span className="text-orange-400 font-bold">{tournament.userPlacement}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-300 text-sm">Winner:</span>
            <span className="text-green-400 text-sm font-medium">{tournament.winner}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        {tournament.status === "upcoming" && (
          <>
            {tournament.registered ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleUnregister(tournament.id)
                }}
                className="flex-1 py-3 bg-red-500 bg-opacity-20 text-red-400 border border-red-500 border-opacity-30 rounded-xl hover:bg-red-500 hover:bg-opacity-30 transition-all font-semibold"
              >
                Unregister
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRegister(tournament.id)
                }}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={tournament.participants >= tournament.maxParticipants}
              >
                {tournament.participants >= tournament.maxParticipants ? "Full" : "Register"}
              </button>
            )}
          </>
        )}
        {tournament.status === "live" && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowBracket(true)
            }}
            className="flex-1 py-3 bg-red-500 bg-opacity-20 text-red-400 border border-red-500 border-opacity-30 rounded-xl hover:bg-red-500 hover:bg-opacity-30 transition-all font-semibold"
          >
            Watch Live
          </button>
        )}
        {tournament.status === "completed" && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowBracket(true)
            }}
            className="flex-1 py-3 bg-gray-600 bg-opacity-20 text-gray-400 border border-gray-600 border-opacity-30 rounded-xl hover:bg-gray-600 hover:bg-opacity-30 transition-all font-semibold"
          >
            View Results
          </button>
        )}
        <button
          onClick={(e) => e.stopPropagation()}
          className="px-6 py-3 bg-gray-700 bg-opacity-50 text-white rounded-xl hover:bg-gray-700 transition-all font-semibold"
        >
          Details
        </button>
      </div>
    </div>
  )

  const renderBracket = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 bg-opacity-90 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 max-w-6xl w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white">Tournament Bracket</h2>
          <button
            onClick={() => setShowBracket(false)}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-8">
          {/* Quarter Finals */}
          <div>
            <h3 className="text-xl font-bold text-orange-400 mb-4">Quarter Finals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bracketData.quarterFinals.map((match, index) => (
                <div key={index} className="bg-gray-700 bg-opacity-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`${match.winner === match.player1 ? "text-green-400 font-bold" : "text-white"}`}>
                      {match.player1}
                    </span>
                    <span className="text-gray-400 text-sm">{match.score}</span>
                  </div>
                  <div className="text-center text-gray-400 text-sm mb-2">vs</div>
                  <div className="flex items-center justify-between">
                    <span className={`${match.winner === match.player2 ? "text-green-400 font-bold" : "text-white"}`}>
                      {match.player2}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Semi Finals */}
          <div>
            <h3 className="text-xl font-bold text-orange-400 mb-4">Semi Finals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bracketData.semiFinals.map((match, index) => (
                <div key={index} className="bg-gray-700 bg-opacity-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white">{match.player1}</span>
                    <span
                      className={`text-sm ${match.score === "Live" ? "text-red-400 animate-pulse" : "text-gray-400"}`}
                    >
                      {match.score}
                    </span>
                  </div>
                  <div className="text-center text-gray-400 text-sm mb-2">vs</div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">{match.player2}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Finals */}
          <div>
            <h3 className="text-xl font-bold text-orange-400 mb-4">Finals</h3>
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-r from-orange-500 to-pink-500 bg-opacity-20 border border-orange-500 border-opacity-50 rounded-xl p-6">
                <div className="text-center">
                  <div className="text-2xl mb-4">🏆</div>
                  <div className="text-white text-lg mb-2">{bracketData.finals[0]?.player1}</div>
                  <div className="text-gray-400 text-sm mb-2">vs</div>
                  <div className="text-white text-lg mb-4">{bracketData.finals[0]?.player2}</div>
                  <div className="text-orange-400 font-semibold">{bracketData.finals?.[0]?.score}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
          className="absolute w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-lg transition-all duration-3500 ease-in-out"
          style={{
            left: `${ballPosition.x}%`,
            top: `${ballPosition.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        ></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4 border-b border-gray-700 border-opacity-50">
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
            <Link to="/leaderboard" className="text-gray-300 hover:text-white transition-colors">
              Leaderboard
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
                  Tournaments
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Compete in exciting tournaments, climb the rankings, and win amazing prizes
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search tournaments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "All", count: tournaments.length },
                  { id: "live", label: "Live", count: tournaments.filter((t) => t.status === "live").length },
                  {
                    id: "upcoming",
                    label: "Upcoming",
                    count: tournaments.filter((t) => t.status === "upcoming").length,
                  },
                  {
                    id: "completed",
                    label: "Completed",
                    count: tournaments.filter((t) => t.status === "completed").length,
                  },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 whitespace-nowrap ${
                      activeFilter === filter.id
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                        : "bg-gray-800 bg-opacity-50 text-gray-400 hover:text-white hover:bg-gray-700 hover:bg-opacity-50"
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded-full">{filter.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Tournaments */}
            {activeFilter === "all" && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-2">⭐</span>
                  Featured Tournaments
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tournaments.filter((t) => t.featured).map((tournament) => renderTournamentCard(tournament))}
                </div>
              </div>
            )}

            {/* All Tournaments */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                {activeFilter === "all"
                  ? "All Tournaments"
                  : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Tournaments`}
              </h2>
              {filteredTournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTournaments.map((tournament) => renderTournamentCard(tournament))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏓</div>
                  <h3 className="text-2xl font-bold text-gray-400 mb-2">No tournaments found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
              )}
            </div>

            {/* Create Tournament Button */}
            <div className="fixed bottom-8 right-8">
              <button className="bg-gradient-to-r from-orange-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center text-2xl hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-110 shadow-2xl">
                ➕
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bracket Modal */}
      {showBracket && renderBracket()}
    </div>
  )
}