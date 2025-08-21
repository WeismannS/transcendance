import Miku from "Miku"
import { Tournament } from "./types"

interface TournamentsTabProps {
  tournamentHistory: Tournament[]
}

export default function TournamentsTab({ tournamentHistory }: TournamentsTabProps) {
  return (
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
}
