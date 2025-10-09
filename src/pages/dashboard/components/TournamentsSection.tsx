import Miku from "Miku";
import { Link } from "Miku/Router";
import { Tournament } from "./types";

interface TournamentsSectionProps {
  tournaments: Tournament[];
  loading?: boolean;
}

function getUIStatus(
  status: Tournament["status"]
): "live" | "upcoming" | "completed" {
  switch (status) {
    case "ongoing":
      return "live";
    case "upcoming":
    case "pending":
      return "upcoming";
    case "done":
    case "cancelled":
      return "completed";
    default:
      return "upcoming";
  }
}

function formatStartTime(startTime: string | null): string {
  if (!startTime) return "TBD";
  try {
    const date = new Date(startTime);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return "TBD";
  }
}

export default function TournamentsSection({
  tournaments,
  loading = false,
}: TournamentsSectionProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white">Tournaments</h2>
          <Link to="/tournaments">
            <button className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2 rounded-full font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all">
              View All Tournaments
            </button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 animate-pulse"
            >
              <div className="h-6 bg-gray-700 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded"></div>
              </div>
              <div className="h-10 bg-gray-700 rounded mt-4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white">Tournaments</h2>
          <Link to="/tournaments">
            <button className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2 rounded-full font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all">
              View All Tournaments
            </button>
          </Link>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No tournaments available</p>
          <p className="text-gray-500 mt-2">
            Check back later for upcoming tournaments!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Tournaments</h2>
        <Link to="/tournaments">
          <button className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2 rounded-full font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all">
            View All Tournaments
          </button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => {
          const uiStatus = getUIStatus(tournament.status);
          return (
            <Link key={tournament.id} to="/tournaments">
              <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 hover:border-orange-500/50 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    {tournament.name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      uiStatus === "live"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : uiStatus === "upcoming"
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        : "bg-green-500/20 text-green-400 border border-green-500/30"
                    }`}
                  >
                    {uiStatus.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-2 text-gray-300">
                  <div className="flex justify-between">
                    <span>Players:</span>
                    <span className="text-white font-semibold">
                      {tournament.playersCount}/4
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prize Pool:</span>
                    <span className="text-orange-400 font-semibold">
                      {tournament.prize || "TBD"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      {uiStatus === "live"
                        ? "Time Left:"
                        : uiStatus === "upcoming"
                        ? "Starts:"
                        : "Result:"}
                    </span>
                    <span className="text-white font-semibold">
                      {uiStatus === "live"
                        ? tournament.timeLeft || "In Progress"
                        : uiStatus === "upcoming"
                        ? formatStartTime(tournament.startTime)
                        : tournament.result || "Completed"}
                    </span>
                  </div>
                </div>
                <button
                  className={`w-full mt-4 py-2 rounded-xl font-semibold transition-all ${
                    uiStatus === "live"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                      : uiStatus === "upcoming"
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
                      : "bg-gray-600/20 text-gray-400 border border-gray-600/30"
                  }`}
                  disabled={uiStatus === "completed"}
                >
                  {uiStatus === "live"
                    ? "Watch Live"
                    : uiStatus === "upcoming"
                    ? "Register"
                    : "View Results"}
                </button>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
