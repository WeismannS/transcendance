import Miku from "Miku";
import { Tournament } from "./types.ts";

interface TournamentsSectionProps {
  tournaments: Tournament[];
}

export default function TournamentsSection({ tournaments }: TournamentsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Tournaments</h2>
        <button className="bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-2 rounded-full font-semibold hover:from-orange-600 hover:to-pink-600 transition-all">
          Join Tournament
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <div key={tournament.id} className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 hover:border-orange-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{tournament.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                tournament.status === "live" 
                  ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                  : tournament.status === "upcoming" 
                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" 
                    : "bg-green-500/20 text-green-400 border border-green-500/30"
              }`}>
                {tournament.status.toUpperCase()}
              </span>
            </div>
            <div className="space-y-2 text-gray-300">
              <div className="flex justify-between">
                <span>Players:</span>
                <span className="text-white font-semibold">{tournament.players}</span>
              </div>
              <div className="flex justify-between">
                <span>Prize Pool:</span>
                <span className="text-orange-400 font-semibold">{tournament.prize}</span>
              </div>
              <div className="flex justify-between">
                <span>{tournament.status === "live" ? "Time Left:" : tournament.status === "upcoming" ? "Starts:" : "Result:"}</span>
                <span className="text-white font-semibold">{tournament.timeLeft || tournament.startTime || tournament.result}</span>
              </div>
            </div>
            <button 
              className={`w-full mt-4 py-2 rounded-xl font-semibold transition-all ${
                tournament.status === "live" 
                  ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30" 
                  : tournament.status === "upcoming" 
                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30" 
                    : "bg-gray-600/20 text-gray-400 border border-gray-600/30"
              }`} 
              disabled={tournament.status === "completed"}
            >
              {tournament.status === "live" ? "Watch Live" : tournament.status === "upcoming" ? "Register" : "View Results"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
