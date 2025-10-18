import Miku, { useEffect, useState } from "Miku";
import { Link } from "Miku/Router";

export default function UserHomePage() {
	const [isVisible, setIsVisible] = useState(false);
	const [ballPosition, setBallPosition] = useState({ x: 85, y: 15 });
	const [currentTime, setCurrentTime] = useState(new Date());
	const [onlineUsers, setOnlineUsers] = useState(1247);
	const [activeTab, setActiveTab] = useState("activity");

	// Mock user data
	const user = {
		name: "John Doe",
		rank: 42,
		wins: 156,
		losses: 89,
		winStreak: 5,
		level: 28,
		xp: 2840,
		nextLevelXp: 3000,
	};

	// Mock data
	const recentMatches = [
		{
			id: 1,
			opponent: "Alex Chen",
			result: "win",
			score: "11-8, 11-6",
			time: "2 hours ago",
			xpGained: 45,
		},
		{
			id: 2,
			opponent: "Maria Rodriguez",
			result: "win",
			score: "11-9, 9-11, 11-7",
			time: "5 hours ago",
			xpGained: 52,
		},
		{
			id: 3,
			opponent: "David Kim",
			result: "loss",
			score: "8-11, 11-9, 9-11",
			time: "1 day ago",
			xpGained: 15,
		},
	];

	const friendActivity = [
		{
			id: 1,
			friend: "Sarah Wilson",
			action: "won a tournament match",
			time: "30 min ago",
			avatar: "SW",
		},
		{
			id: 2,
			friend: "Mike Johnson",
			action: "reached level 35",
			time: "1 hour ago",
			avatar: "MJ",
		},
		{
			id: 3,
			friend: "Emma Davis",
			action: "joined Speed Masters tournament",
			time: "2 hours ago",
			avatar: "ED",
		},
	];

	const upcomingTournaments = [
		{
			id: 1,
			name: "Daily Blitz",
			startTime: "15 minutes",
			players: "24/32",
			prize: "$500",
		},
		{
			id: 2,
			name: "Weekend Warriors",
			startTime: "2 hours",
			players: "45/64",
			prize: "$2,000",
		},
	];

	const platformNews = [
		{
			id: 1,
			title: "New Tournament Mode: King of the Hill",
			summary:
				"Compete in our newest tournament format with rotating champions",
			time: "2 days ago",
		},
		{
			id: 2,
			title: "Season 3 Rankings Reset",
			summary: "New season starts next week with exclusive rewards",
			time: "1 week ago",
		},
	];

	useEffect(() => {
		setIsVisible(true);

		// Update time every minute
		const timeInterval = setInterval(() => {
			setCurrentTime(new Date());
		}, 60000);

		// Animated ping pong ball
		const ballInterval = setInterval(() => {
			setBallPosition((prev) => ({
				x: Math.random() * 80 + 10,
				y: Math.random() * 30 + 10,
			}));
		}, 3500);

		// Simulate online users fluctuation
		const usersInterval = setInterval(() => {
			setOnlineUsers((prev) => prev + Math.floor(Math.random() * 20 - 10));
		}, 8000);

		return () => {
			clearInterval(timeInterval);
			clearInterval(ballInterval);
			clearInterval(usersInterval);
		};
	}, []);

	const getGreeting = () => {
		const hour = currentTime.getHours();
		if (hour < 12) return "Good Morning";
		if (hour < 18) return "Good Afternoon";
		return "Good Evening";
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
			{/* Animated Background Elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
				<div className="absolute top-60 right-20 w-1 h-1 bg-cyan-400 rounded-full animate-ping"></div>
				<div className="absolute bottom-40 left-1/3 w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>

				{/* Animated Ping Pong Ball */}
				<div
					className="absolute w-4 h-4 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full shadow-lg transition-all duration-3500 ease-in-out"
					style={{
						left: `${ballPosition.x}%`,
						top: `${ballPosition.y}%`,
						transform: "translate(-50%, -50%)",
					}}
				></div>

				{/* Geometric shapes */}
				<div className="absolute top-1/3 right-1/4 w-32 h-32 border border-cyan-500/10 rounded-full"></div>
				<div className="absolute bottom-1/3 left-1/4 w-24 h-24 border border-blue-500/10 rounded-full"></div>
			</div>

			{/* Header */}
			<header className="relative z-10 px-6 py-4 border-b border-gray-700/50">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
							<span className="text-white font-bold text-sm">🏓</span>
						</div>
						<span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
							PingPong Pro
						</span>
					</div>
					<nav className="hidden md:flex items-center space-x-6">
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
					</nav>{" "}
					<div className="flex items-center space-x-4">
						<div className="flex items-center space-x-2 text-gray-300">
							<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
							<span className="text-sm">
								{onlineUsers.toLocaleString()} online
							</span>
						</div>

						<div className="flex items-center space-x-3">
							<div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
								<span className="text-white font-bold text-sm">JD</span>
							</div>
							<span className="text-white font-semibold">{user.name}</span>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="relative z-10 px-6 py-8">
				<div className="max-w-7xl mx-auto">
					<div
						className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
					>
						{/* Welcome Section */}
						<div className="mb-8">
							<h1 className="text-4xl md:text-5xl font-bold mb-2">
								<span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
									{getGreeting()}, {user.name.split(" ")[0]}!
								</span>
							</h1>
							<p className="text-xl text-gray-300">
								Ready to dominate the table today?
							</p>
						</div>

						{/* Quick Stats & Actions */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
							{/* Current Rank */}
							<div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 text-center">
								<div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
									#{user.rank !== null ? user.rank : "Unranked"}
								</div>
								<div className="text-gray-400">Global Rank</div>
							</div>

							{/* Win Streak */}
							<div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 text-center">
								<div className="text-3xl font-bold text-green-400 mb-2">
									🔥 {user.winStreak}
								</div>
								<div className="text-gray-400">Win Streak</div>
							</div>

							{/* Level Progress */}
							<div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
								<div className="flex items-center justify-between mb-2">
									<span className="text-white font-semibold">
										Level {user.level}
									</span>
									<span className="text-gray-400 text-sm">
										{user.xp}/{user.nextLevelXp} XP
									</span>
								</div>
								<div className="w-full bg-gray-700 rounded-full h-2">
									<div
										className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
										style={{ width: `${(user.xp / user.nextLevelXp) * 100}%` }}
									></div>
								</div>
							</div>

							{/* Quick Play */}
							<div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-6 text-center cursor-pointer hover:from-cyan-600 hover:to-blue-600 transition-all transform hover:scale-105">
								<div className="text-2xl mb-2">⚡</div>
								<div className="font-bold">Quick Match</div>
								<div className="text-sm opacity-90">Find opponent</div>
							</div>
						</div>

						{/* Main Content Grid */}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
							{/* Left Column - Recent Activity */}
							<div className="lg:col-span-2 space-y-8">
								{/* Recent Matches */}
								<div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
									<h2 className="text-2xl font-bold text-white mb-6">
										Recent Matches
									</h2>
									<div className="space-y-4">
										{recentMatches.map((match) => (
											<div
												key={match.id}
												className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all"
											>
												<div className="flex items-center space-x-4">
													<div
														className={`w-3 h-3 rounded-full ${match.result === "win" ? "bg-green-500" : "bg-red-500"}`}
													></div>
													<div>
														<div className="text-white font-semibold">
															vs {match.opponent}
														</div>
														<div className="text-gray-400 text-sm">
															{match.score}
														</div>
													</div>
												</div>
												<div className="text-right">
													<div className="text-orange-400 font-semibold">
														+{match.xpGained} XP
													</div>
													<div className="text-gray-400 text-sm">
														{match.time}
													</div>
												</div>
											</div>
										))}
									</div>
									<button className="w-full mt-4 py-2 text-orange-400 hover:text-orange-300 transition-colors">
										View All Matches →
									</button>
								</div>

								{/* Activity Feed Tabs */}
								<div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
									<div className="flex space-x-4 mb-6">
										{[
											{ id: "activity", label: "Friend Activity" },
											{ id: "news", label: "Platform News" },
										].map((tab) => (
											<button
												key={tab.id}
												onClick={() => setActiveTab(tab.id)}
												className={`px-4 py-2 rounded-xl font-semibold transition-all ${
													activeTab === tab.id
														? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
														: "text-gray-400 hover:text-white"
												}`}
											>
												{tab.label}
											</button>
										))}
									</div>

									{activeTab === "activity" && (
										<div className="space-y-4">
											{friendActivity.map((activity) => (
												<div
													key={activity.id}
													className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-700/30 transition-all"
												>
													<div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
														<span className="text-white font-bold text-sm">
															{activity.avatar}
														</span>
													</div>
													<div className="flex-1">
														<div className="text-white">
															<span className="font-semibold">
																{activity.friend}
															</span>{" "}
															{activity.action}
														</div>
														<div className="text-gray-400 text-sm">
															{activity.time}
														</div>
													</div>
												</div>
											))}
										</div>
									)}

									{activeTab === "news" && (
										<div className="space-y-4">
											{platformNews.map((news) => (
												<div
													key={news.id}
													className="p-4 rounded-xl hover:bg-gray-700/30 transition-all cursor-pointer"
												>
													<h3 className="text-white font-semibold mb-2">
														{news.title}
													</h3>
													<p className="text-gray-300 text-sm mb-2">
														{news.summary}
													</p>
													<div className="text-gray-400 text-xs">
														{news.time}
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							</div>

							{/* Right Column - Sidebar */}
							<div className="space-y-6">
								{/* Upcoming Tournaments */}
								<div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
									<h3 className="text-xl font-bold text-white mb-4">
										Upcoming Tournaments
									</h3>
									<div className="space-y-4">
										{upcomingTournaments.map((tournament) => (
											<div
												key={tournament.id}
												className="p-4 bg-gray-700/30 rounded-xl"
											>
												<h4 className="text-white font-semibold mb-2">
													{tournament.name}
												</h4>
												<div className="space-y-1 text-sm">
													<div className="flex justify-between text-gray-300">
														<span>Starts in:</span>
														<span className="text-orange-400">
															{tournament.startTime}
														</span>
													</div>
													<div className="flex justify-between text-gray-300">
														<span>Players:</span>
														<span>{tournament.players}</span>
													</div>
													<div className="flex justify-between text-gray-300">
														<span>Prize:</span>
														<span className="text-green-400">
															{tournament.prize}
														</span>
													</div>
												</div>
												<button className="w-full mt-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-all">
													Join Tournament
												</button>
											</div>
										))}
									</div>
								</div>

								{/* Quick Stats */}
								<div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
									<h3 className="text-xl font-bold text-white mb-4">
										Your Stats
									</h3>
									<div className="space-y-3">
										<div className="flex justify-between">
											<span className="text-gray-400">Total Wins:</span>
											<span className="text-green-400 font-semibold">
												{user.wins}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-400">Total Losses:</span>
											<span className="text-red-400 font-semibold">
												{user.losses}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-400">Win Rate:</span>
											<span className="text-orange-400 font-semibold">
												{Math.round(
													(user.wins / (user.wins + user.losses)) * 100,
												)}
												%
											</span>
										</div>
									</div>
								</div>

								{/* Quick Actions */}
								<div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
									<h3 className="text-xl font-bold text-white mb-4">
										Quick Actions
									</h3>
									<div className="space-y-3">
										<button className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all">
											Challenge Friend
										</button>
										<button className="w-full py-3 bg-gray-700/50 text-white rounded-xl hover:bg-gray-700 transition-all">
											Practice Mode
										</button>
										<button className="w-full py-3 bg-gray-700/50 text-white rounded-xl hover:bg-gray-700 transition-all">
											View Replays
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
