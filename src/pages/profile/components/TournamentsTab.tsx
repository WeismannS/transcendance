import Miku, { useState } from "Miku";
import type { Tournament } from "./types";
import { useUserProfile } from "../../../hooks/useStates";
import { leaveTournament } from "../../../services/api/tournament";

interface TournamentsTabProps {
	tournamentHistory: Tournament[];
}

export default function TournamentsTab({
	tournamentHistory,
}: TournamentsTabProps) {
	const userProfile = useUserProfile();
	// local copy so we can optimistically update UI after leaving
	const [localHistory, setLocalHistory] = useState<Tournament[]>(tournamentHistory);

	const handleLeave = async (tournamentId: string) => {
		try {
			await leaveTournament(tournamentId);
			// optimistic UI update: remove current user from players and decrement playerCount
			setLocalHistory((prev) =>
				prev.map((t) =>
					t.id === tournamentId
						? {
							  ...t,
							  players: t.players?.filter((p) => p.id !== String(userProfile?.id)) || [],
							  playerCount: Math.max((t.playerCount || 1) - 1, 0),
						  }
						: t,
				),
			);
		} catch (err: any) {
			console.error("Failed to leave tournament:", err);
			alert(err.message || "Failed to leave tournament");
		}
	};
	
	return (
		<div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
			<h3 className="text-xl font-bold text-white mb-6">Tournament History</h3>
			<div className="space-y-4">
				{localHistory.map((tournament) => {
					const isPlayer = !!tournament.players?.some((p) => p.id === String(userProfile?.id));
					return (
						<div
							key={tournament.id}
							className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all"
						>
							<div>
								<h4 className="text-white font-semibold">{tournament.name}</h4>
								<div className="text-gray-400 text-sm">
									{tournament.playerCount} participants • {tournament.startDate}
								</div>
							</div>
							<div className="text-right flex flex-col items-end gap-2">
								<div className="font-semibold text-gray-400">{tournament.status}</div>
								<div className="text-green-400 text-sm">{tournament.winnerId}</div>
								{tournament.status === "upcoming" && isPlayer && (
									<button
										onClick={() => handleLeave(tournament.id)}
										className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
									>
										Leave
									</button>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
