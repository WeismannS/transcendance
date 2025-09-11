"use client";

import Miku, { useState, useEffect } from "Miku";
import { Link } from "Miku/Router";
import { useUserProfile } from "../../hooks/useStates.ts";
import {
  API_URL,
  getTournaments,
  getTournamentMatches,
  createTournament,
  joinTournament,
  leaveTournament,
  startTournament,
  stopTournament,
  sendTournamentChallenge,
  sendChallenge,
} from "../../services/api.ts";

interface Tournament {
  id: string;
  name: string;
  status: string;
  type: string;
  participants: number;
  maxParticipants: number;
  prize: string;
  entryFee: string;
  startTime: string;
  endTime: string;
  description: string;
  rules: string;
  currentRound: string;
  registered: boolean;
  featured: boolean;
  difficulty: string;
  organizer: string;
  createdBy?: string;
  players?: any[];
  winner?: string;
  userPlacement?: string;
}

export default function TournamentsPage() {
  // Get user profile from backend via state management
  const userProfile = useUserProfile();

  const [isVisible, setIsVisible] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 75, y: 25 });
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBracket, setShowBracket] = useState(false);
  const [showTournamentDetails, setShowTournamentDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Tournament data from backend
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentMatches, setTournamentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [error, setError] = useState("");

  // Create tournament form
  const [newTournament, setNewTournament] = useState({
    name: "",
    startTime: "",
  });

  // Load tournaments from backend
  const loadTournaments = async () => {
    try {
      setLoading(true);
      setError("");
      const tournamentsData = await getTournaments();

      // Transform backend data to match frontend interface
      const transformedTournaments = tournamentsData.map((tournament: any) => ({
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        type: "4-Player Tournament", // Fixed type for our use case
        participants:
          tournament.playersCount || tournament.players?.length || 0,
        maxParticipants: 4, // Fixed to 4 as per requirements
        prize: "TBD", // Could be added to backend later
        entryFee: "Free", // Could be added to backend later
        startTime: tournament.startTime
          ? new Date(tournament.startTime).toLocaleString()
          : "TBD",
        endTime: "TBD",
        description: `Tournament created by user. ${
          tournament.participants || tournament.players?.length || 0
        }/4 players registered.`,
        rules: "Best of 3 sets, 11 points per set",
        currentRound:
          tournament.status === "upcoming"
            ? "Registration Open"
            : tournament.status === "started"
            ? "In Progress"
            : "Completed",
        registered:
          tournament.players?.some((p: any) => p.userId === userProfile?.id) ||
          false,
        featured: false,
        difficulty: "Intermediate",
        organizer: "Player",
        createdBy: tournament.createdBy,
        players: tournament.players || [],
      }));

      setTournaments(transformedTournaments);
    } catch (err: any) {
      setError(err.message || "Failed to load tournaments");
      console.error("Failed to load tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentMatches = async (tournamentId: string) => {
    try {
      setMatchesLoading(true);
      const matches = await getTournamentMatches(tournamentId);
      setTournamentMatches(matches);
    } catch (err: any) {
      setError(err.message || "Failed to load tournament matches");
      console.error("Failed to load tournament matches:", err);
    } finally {
      setMatchesLoading(false);
    }
  };

  const handleTournamentChallenge = async (match: any) => {
    if (!userProfile) return;

    try {
      // Determine the opponent ID and opponent name
      const opponentId =
        match.player1Id === String(userProfile.id)
          ? match.player2Id
          : match.player1Id;

      const opponentName =
        match.player1Id === String(userProfile.id)
          ? match.player2?.displayName
          : match.player1?.displayName;

      const result = await sendChallenge(opponentId, "tournament");
      console.log("Tournament challenge sent:", result);

      // Show success message
      alert(`Tournament challenge sent to ${opponentName}!`);
    } catch (err: any) {
      setError(err.message || "Failed to send tournament challenge");
      console.error("Failed to send tournament challenge:", err);

      // Show error message
      const errorMessage = err.message || "Unknown error";
      alert(`Failed to send tournament challenge: ${errorMessage}`);
    }
  };

  const bracketData = {
    quarterFinals: [
      {
        player1: "Alex Chen",
        player2: "Maria Rodriguez",
        winner: "Alex Chen",
        score: "3-1",
      },
      {
        player1: "David Kim",
        player2: "Sarah Wilson",
        winner: "David Kim",
        score: "3-2",
      },
      {
        player1: "Mike Johnson",
        player2: "Emma Davis",
        winner: "Mike Johnson",
        score: "3-0",
      },
      {
        player1: "John Doe",
        player2: "Lisa Park",
        winner: "John Doe",
        score: "3-1",
      },
    ],
    semiFinals: [
      {
        player1: "Alex Chen",
        player2: "David Kim",
        winner: null,
        score: "Live",
      },
      {
        player1: "Mike Johnson",
        player2: "John Doe",
        winner: null,
        score: "Upcoming",
      },
    ],
    finals: [{ player1: "TBD", player2: "TBD", winner: null, score: "TBD" }],
  };

  useEffect(() => {
    setIsVisible(true);

    // Log user profile for debugging
    console.log("Tournament page - User profile:", userProfile);

    // Load tournaments when component mounts or user profile changes
    if (userProfile) {
      loadTournaments();
    }

    // Animated ping pong ball
    const ballInterval = setInterval(() => {
      setBallPosition((prev) => ({
        x: Math.random() * 70 + 15,
        y: Math.random() * 50 + 25,
      }));
    }, 3500);

    return () => clearInterval(ballInterval);
  }, [userProfile]);

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesFilter =
      activeFilter === "all" || tournament.status === activeFilter;
    const matchesSearch = tournament.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Tournament action handlers
  const handleCreateTournament = async () => {
    if (!userProfile || !newTournament.name.trim()) return;

    try {
      const startTime =
        newTournament.startTime || new Date(Date.now() + 60000).toISOString(); // Default to 1 minute from now

      await createTournament({
        name: newTournament.name,
        status: "upcoming",
        startTime: startTime,
        username: userProfile.displayName,
      });

      // Reset form and close modal
      setNewTournament({ name: "", startTime: "" });
      setShowCreateModal(false);

      // Reload tournaments
      await loadTournaments();
    } catch (err: any) {
      setError(err.message || "Failed to create tournament");
    }
  };

  const handleRegister = async (tournamentId: string) => {
    if (!userProfile) return;

    try {
      await joinTournament(tournamentId, userProfile.displayName);
      await loadTournaments(); // Reload to get updated data
    } catch (err: any) {
      setError(err.message || "Failed to join tournament");
    }
  };

  const handleUnregister = async (tournamentId: string) => {
    try {
      await leaveTournament(tournamentId);
      await loadTournaments(); // Reload to get updated data
    } catch (err: any) {
      setError(err.message || "Failed to leave tournament");
    }
  };

  const handleStartTournament = async (tournamentId: string) => {
    try {
      await startTournament(tournamentId);
      await loadTournaments(); // Reload to get updated data
    } catch (err: any) {
      setError(err.message || "Failed to start tournament");
    }
  };

  const handleStopTournament = async (tournamentId: string) => {
    try {
      await stopTournament(tournamentId);
      await loadTournaments(); // Reload to get updated data
    } catch (err: any) {
      setError(err.message || "Failed to stop tournament");
    }
  };
  const renderTournamentCard = (tournament: any) => (
    <div
      key={tournament.id}
      className={`bg-gray-800 bg-opacity-50 backdrop-blur-lg border rounded-2xl p-6 hover:border-orange-500 hover:border-opacity-50 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
        tournament.featured
          ? "border-orange-500 border-opacity-30"
          : "border-gray-700"
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
        <h3 className="text-xl font-bold text-white flex-1 pr-4">
          {tournament.name}
        </h3>
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

      <p className="text-gray-300 text-sm mb-4 line-clamp-2 min-h-10">
        {tournament.description}
      </p>

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
            <span className="text-green-400 font-semibold">
              {tournament.prize}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Entry:</span>
            <span className="text-orange-400 font-medium">
              {tournament.entryFee}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">
              {tournament.status === "live"
                ? "Round:"
                : tournament.status === "upcoming"
                ? "Starts:"
                : "Ended:"}
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
            <span className="text-orange-400 font-bold">
              {tournament.userPlacement}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-300 text-sm">Winner:</span>
            <span className="text-green-400 text-sm font-medium">
              {tournament.winner}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        {/* Debug logs for Start Tournament button visibility */}
        {console.log("Tournament debug:", {
          tournamentId: tournament.id,
          createdBy: tournament.createdBy,
          userProfileId: userProfile?.id,
          userProfileIdString: String(userProfile?.id),
          isCreator: tournament.createdBy === String(userProfile?.id),
          status: tournament.status,
          participants: tournament.participants,
          canStart:
            tournament.status === "upcoming" && tournament.participants >= 4,
        })}

        {/* Creator controls */}
        {tournament.createdBy === String(userProfile?.id) && (
          <>
            {tournament.status === "upcoming" &&
              tournament.participants >= 4 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartTournament(tournament.id);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-semibold"
                >
                  Start Tournament
                </button>
              )}
            {(tournament.status === "upcoming" ||
              tournament.status === "started") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStopTournament(tournament.id);
                }}
                className="flex-1 py-3 bg-red-500 bg-opacity-20 text-red-400 border border-red-500 border-opacity-30 rounded-xl hover:bg-red-500 hover:bg-opacity-30 transition-all font-semibold"
              >
                Cancel Tournament
              </button>
            )}
          </>
        )}

        {/* Player controls */}
        {tournament.createdBy !== userProfile?.id &&
          tournament.status === "upcoming" && (
            <>
              {tournament.registered ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnregister(tournament.id);
                  }}
                  className="flex-1 py-3 bg-red-500 bg-opacity-20 text-red-400 border border-red-500 border-opacity-30 rounded-xl hover:bg-red-500 hover:bg-opacity-30 transition-all font-semibold"
                >
                  Leave Tournament
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRegister(tournament.id);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    tournament.participants >= tournament.maxParticipants
                  }
                >
                  {tournament.participants >= tournament.maxParticipants
                    ? "Full (4/4)"
                    : `Join Tournament (${tournament.participants}/4)`}
                </button>
              )}
            </>
          )}

        {/* Live tournament controls */}
        {tournament.status === "started" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowBracket(true);
            }}
            className="flex-1 py-3 bg-red-500 bg-opacity-20 text-red-400 border border-red-500 border-opacity-30 rounded-xl hover:bg-red-500 hover:bg-opacity-30 transition-all font-semibold"
          >
            Watch Live
          </button>
        )}

        {/* Completed tournament controls */}
        {tournament.status === "completed" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowBracket(true);
            }}
            className="flex-1 py-3 bg-gray-600 bg-opacity-20 text-gray-400 border border-gray-600 border-opacity-30 rounded-xl hover:bg-gray-600 hover:bg-opacity-30 transition-all font-semibold"
          >
            View Results
          </button>
        )}

        {/* Details button (always available) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTournament(tournament);
            setShowTournamentDetails(true);
            loadTournamentMatches(tournament.id);
          }}
          className="px-6 py-3 bg-gray-700 bg-opacity-50 text-white rounded-xl hover:bg-gray-700 transition-all font-semibold"
        >
          Details
        </button>
      </div>
    </div>
  );

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
            <h3 className="text-xl font-bold text-orange-400 mb-4">
              Quarter Finals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bracketData.quarterFinals.map((match, index) => (
                <div
                  key={index}
                  className="bg-gray-700 bg-opacity-50 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`${
                        match.winner === match.player1
                          ? "text-green-400 font-bold"
                          : "text-white"
                      }`}
                    >
                      {match.player1}
                    </span>
                    <span className="text-gray-400 text-sm">{match.score}</span>
                  </div>
                  <div className="text-center text-gray-400 text-sm mb-2">
                    vs
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`${
                        match.winner === match.player2
                          ? "text-green-400 font-bold"
                          : "text-white"
                      }`}
                    >
                      {match.player2}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Semi Finals */}
          <div>
            <h3 className="text-xl font-bold text-orange-400 mb-4">
              Semi Finals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bracketData.semiFinals.map((match, index) => (
                <div
                  key={index}
                  className="bg-gray-700 bg-opacity-50 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white">{match.player1}</span>
                    <span
                      className={`text-sm ${
                        match.score === "Live"
                          ? "text-red-400 animate-pulse"
                          : "text-gray-400"
                      }`}
                    >
                      {match.score}
                    </span>
                  </div>
                  <div className="text-center text-gray-400 text-sm mb-2">
                    vs
                  </div>
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
                  <div className="text-white text-lg mb-2">
                    {bracketData.finals[0]?.player1}
                  </div>
                  <div className="text-gray-400 text-sm mb-2">vs</div>
                  <div className="text-white text-lg mb-4">
                    {bracketData.finals[0]?.player2}
                  </div>
                  <div className="text-orange-400 font-semibold">
                    {bracketData.finals?.[0]?.score}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render tournament details modal
  const renderTournamentDetails = () => {
    if (!showTournamentDetails || !selectedTournament) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">
              {selectedTournament.name} - Matches
            </h3>
            <button
              onClick={() => setShowTournamentDetails(false)}
              className="text-gray-400 hover:text-white text-xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {matchesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="text-gray-300 mt-4">Loading matches...</p>
              </div>
            ) : tournamentMatches.length > 0 ? (
              <div className="space-y-6">
                {/* Group matches by round */}
                {Array.from(
                  new Set(tournamentMatches.map((match) => match.round))
                )
                  .sort()
                  .map((round) => (
                    <div key={round} className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-4">
                        {round === 1
                          ? "Semi-Finals"
                          : round === 2
                          ? "Finals"
                          : `Round ${round}`}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tournamentMatches
                          .filter((match) => match.round === round)
                          .map((match) => (
                            <div
                              key={match.id}
                              className="bg-gray-800 rounded-lg p-4"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <div className="text-center flex-1">
                                  <p className="text-white font-medium">
                                    {match.player1?.displayName || "TBD"}
                                  </p>
                                  {match.status === "COMPLETED" && (
                                    <p className="text-sm text-gray-400">
                                      Score: {match.player1Score || 0}
                                    </p>
                                  )}
                                </div>
                                <div className="px-4 text-gray-400 font-bold">
                                  VS
                                </div>
                                <div className="text-center flex-1">
                                  <p className="text-white font-medium">
                                    {match.player2?.displayName || "TBD"}
                                  </p>
                                  {match.status === "COMPLETED" && (
                                    <p className="text-sm text-gray-400">
                                      Score: {match.player2Score || 0}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="text-center">
                                <p
                                  className={`text-sm font-medium mb-2 ${
                                    match.status?.toLowerCase() === "completed"
                                      ? "text-green-400"
                                      : match.status?.toLowerCase() ===
                                        "in_progress"
                                      ? "text-yellow-400"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {match.status?.toLowerCase() === "completed"
                                    ? "Completed"
                                    : match.status?.toLowerCase() ===
                                      "in_progress"
                                    ? "In Progress"
                                    : "Pending"}
                                </p>

                                {/* Show start button only for user's pending matches */}
                                {console.log(
                                  "Debug - match:",
                                  match,
                                  "userProfile:",
                                  userProfile
                                )}
                                {match.status?.toLowerCase() === "pending" &&
                                  userProfile &&
                                  (match.player1Id === String(userProfile.id) ||
                                    match.player2Id ===
                                      String(userProfile.id)) && (
                                    <button
                                      onClick={() =>
                                        handleTournamentChallenge(match)
                                      }
                                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-lg transition-all font-medium"
                                    >
                                      Challenge
                                    </button>
                                  )}

                                {/* Debug info - remove this later */}
                                <div className="text-xs text-gray-500 mt-2">
                                  <div>Match Status: {match.status}</div>
                                  <div>Player1 ID: {match.player1Id}</div>
                                  <div>Player2 ID: {match.player2Id}</div>
                                  <div>Current User ID: {userProfile?.id}</div>
                                  <div>
                                    Is User Player:{" "}
                                    {userProfile &&
                                    (match.player1Id ===
                                      String(userProfile.id) ||
                                      match.player2Id ===
                                        String(userProfile.id))
                                      ? "YES"
                                      : "NO"}
                                  </div>
                                </div>

                                {match.status?.toLowerCase() === "completed" &&
                                  match.winnerId && (
                                    <p className="text-sm text-blue-400">
                                      Winner:{" "}
                                      {match.winnerId === match.player1Id
                                        ? match.player1?.displayName
                                        : match.player2?.displayName}
                                    </p>
                                  )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-300">
                  No matches found for this tournament.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {renderTournamentDetails()}
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
            <Link
              to="/home"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/leaderboard"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Leaderboard
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
              {userProfile?.avatar ? (
                <img
                  src={API_URL + `/${userProfile.avatar}`}
                  alt={userProfile.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm">
                  {userProfile?.displayName
                    ? userProfile.displayName.slice(0, 2).toUpperCase()
                    : "U"}
                </span>
              )}
            </div>
            <span className="text-white font-semibold">
              {userProfile?.displayName || "Loading..."}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div
            className={`transition-all duration-1000 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            {/* Page Header */}
            <div className="text-center mb-8">
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                  Tournaments
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Compete in exciting tournaments, climb the rankings, and win
                amazing prizes
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
                  {
                    id: "live",
                    label: "Live",
                    count: tournaments.filter((t) => t.status === "live")
                      .length,
                  },
                  {
                    id: "upcoming",
                    label: "Upcoming",
                    count: tournaments.filter((t) => t.status === "upcoming")
                      .length,
                  },
                  {
                    id: "completed",
                    label: "Completed",
                    count: tournaments.filter((t) => t.status === "completed")
                      .length,
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
                    <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded-full">
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-xl text-red-400">
                {error}
                <button
                  onClick={() => setError("")}
                  className="ml-4 text-red-300 hover:text-red-100"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 animate-spin">🏓</div>
                <h3 className="text-2xl font-bold text-gray-400 mb-2">
                  Loading tournaments...
                </h3>
                <p className="text-gray-500">
                  Please wait while we fetch the latest tournaments
                </p>
              </div>
            ) : (
              <>
                {/* All Tournaments */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">
                    {activeFilter === "all"
                      ? "All Tournaments"
                      : `${
                          activeFilter.charAt(0).toUpperCase() +
                          activeFilter.slice(1)
                        } Tournaments`}
                  </h2>
                  {filteredTournaments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredTournaments.map((tournament) =>
                        renderTournamentCard(tournament)
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🏓</div>
                      <h3 className="text-2xl font-bold text-gray-400 mb-2">
                        No tournaments found
                      </h3>
                      <p className="text-gray-500">
                        {tournaments.length === 0
                          ? "Be the first to create a tournament!"
                          : "Try adjusting your search or filters"}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Create Tournament Button */}
            <div className="fixed bottom-8 right-8">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-orange-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center text-2xl hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-110 shadow-2xl"
              >
                ➕
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bracket Modal */}
      {showBracket && renderBracket()}

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">
                Create Tournament
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tournament Name
                </label>
                <input
                  type="text"
                  value={newTournament.name}
                  onChange={(e) =>
                    setNewTournament((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter tournament name..."
                  className="w-full px-4 py-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={newTournament.startTime}
                  onChange={(e) =>
                    setNewTournament((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <p className="text-gray-400 text-sm mt-1">
                  Leave empty for immediate availability
                </p>
              </div>

              <div className="bg-gray-700 bg-opacity-30 p-4 rounded-xl">
                <h3 className="text-white font-semibold mb-2">
                  Tournament Info
                </h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Maximum 4 players</li>
                  <li>• Tournament creator can start when 2+ players join</li>
                  <li>• Semifinals → Finals format</li>
                  <li>• You'll be automatically registered as a player</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-gray-600 bg-opacity-50 text-gray-300 rounded-xl hover:bg-gray-600 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTournament}
                  disabled={!newTournament.name.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Tournament
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
