import UniversalHeader from "../../components/UniversalHeader.tsx";
import { useDashboardData } from "../../hooks/useStates.ts";
import Miku, { useEffect, useState } from "Miku";
import { API_URL, logOut, updateProfile } from "../../services/api.ts";
import { Achievement, User } from "../../types/user.ts";
import {
	AnimatedBackground,
	ChatsSection,
	FloatingQuickMatchButton,
	Friends,
	Navigation,
	Overview,
	ProfileSection,
	TournamentsSection,
} from "./components/index.ts";
import { useNotifications } from "../use-notification";

export default function DashboardPage() {
	const {
		identity,
		profile,
		gameState,
		social,
		achievements,
		notifications,
		messages,
	} = useDashboardData();
	const {addNotification} = useNotifications();
	// Check if we should start with a specific section (e.g., from profile message button)
	const initialSection =
		sessionStorage.getItem("dashboardActiveSection") || "overview";
	const [activeSection, setActiveSection] = useState(initialSection);

	// Check if we should start in edit mode (e.g., from profile edit button)
	const initialEditMode =
		sessionStorage.getItem("dashboardEditMode") === "true";
	const [isEditMode, setIsEditMode] = useState(initialEditMode);

	// Clear the sessionStorage after using it
	useEffect(() => {
		if (sessionStorage.getItem("dashboardActiveSection")) {
			sessionStorage.removeItem("dashboardActiveSection");
		}
		if (sessionStorage.getItem("dashboardEditMode")) {
			sessionStorage.removeItem("dashboardEditMode");
		}
	}, []);

	const [isVisible, setIsVisible] = useState(false);
	const [ballPosition, setBallPosition] = useState({ x: 90, y: 10 });
	const [notificationCount, setNotificationCount] = useState(3);
	const [onlineUsers, setOnlineUsers] = useState(0);
	const [userStats, setUserStats] = useState({
		wins: gameState?.stats.wins ?? 0,
		losses: gameState?.stats.losses ?? 0,
		rank: profile?.rank ?? 0,
		winRate:
			gameState?.stats.totalGames && gameState.stats.totalGames > 0
				? ((gameState.stats.wins / gameState.stats.totalGames) * 100).toFixed(1)
				: 0,
	});

	// State for profile editing - removed duplicate declaration as it's now initialized above
	const [editableProfile, setEditableProfile] = useState({
		displayName: profile?.displayName || "",
		bio: profile?.bio || "",
		avatarFile: profile?.avatar ? null : (null as File | null), // Initially null if no avatar
		avatarPreview: profile?.avatar ? API_URL + `/${profile.avatar}` : "",
	});

	useEffect(() => {
		setIsVisible(true);
		// Initialize editable profile state when profile data is available
		if (profile) {
			setEditableProfile({
				displayName: profile.displayName || "",
				bio: profile.bio || "",
				avatarFile: null,
				avatarPreview: profile.avatar ? API_URL + `/${profile.avatar}` : "",
			});
		}

		// Update user stats when game state changes
		if (gameState) {
			setUserStats({
				wins: gameState.stats.wins,
				losses: gameState.stats.losses,
				rank: profile?.rank ?? 0,
				winRate:
					gameState.stats.totalGames > 0
						? (
								(gameState.stats.wins / gameState.stats.totalGames) *
								100
							).toFixed(1)
						: 0,
			});
		}

		// Animated ping pong ball
		const ballInterval = setInterval(() => {
			setBallPosition((prev) => ({
				x: Math.random() * 80 + 10,
				y: Math.random() * 20 + 5,
			}));
		}, 4000);

		return () => clearInterval(ballInterval);
	}, [profile, gameState]);

	// Profile Edit Handlers
	const handleSave = async () => {
		const result = await updateProfile({
			displayName: editableProfile.displayName,
			bio: editableProfile.bio,
			avatar: editableProfile.avatarFile ?? null,
		});
		console.log("Profile updated:", result);
		if (result.success) {
			setIsEditMode(false);
		}
		else {
			addNotification({
				type: "error",
				message: `Failed to update profile. ${result.error}`,
				duration: 5000,
				title: "Profile Update Error",
			});
		}
		
	};

	const handleCancel = () => {
		setIsEditMode(false);
		if (profile) {
			setEditableProfile({
				displayName: profile.displayName || "",
				bio: profile.bio || "",
				avatarFile: null,
				avatarPreview: profile.avatar ? API_URL + `/${profile.avatar}` : "",
			});
		}
	};

	const handleProfileChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setEditableProfile((prev) => ({ ...prev, [name]: value }));
	};

	const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			setEditableProfile((prev) => ({
				...prev,
				avatarFile: file,
				avatarPreview: URL.createObjectURL(file),
			}));
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
			{/* Animated Background Elements */}
			<AnimatedBackground ballPosition={ballPosition} />

			{/* Header */}
			<UniversalHeader
				onLogout={logOut}
				profile={profile}
				onlineUsers={social?.onlineUsers || onlineUsers}
				notifications={notifications?.unreadCount || notificationCount}
			/>

			{/* Navigation */}
			<Navigation
				activeSection={activeSection}
				setActiveSection={setActiveSection}
			/>

			{/* Main Content */}
			<main className="relative z-10 px-6 py-8">
				<div className="max-w-7xl mx-auto">
					<div
						className={`transition-all duration-500 ${
							isVisible
								? "opacity-100 translate-y-0"
								: "opacity-0 translate-y-10"
						}`}
					>
						{activeSection === "overview" && <Overview />}
						{activeSection === "tournaments" && <TournamentsSection />}
						{activeSection === "chats" && <ChatsSection />}
						{activeSection === "friends" && (
							<Friends setActiveSection={setActiveSection} />
						)}
						{activeSection === "profile" && (
							<ProfileSection
								profile={profile}
								gameState={gameState}
								achievements={achievements?.allAchievements || []}
								userAchievementIds={achievements?.userAchievementIds || []}
								userStats={userStats}
								isEditMode={isEditMode}
								editableProfile={editableProfile}
								setIsEditMode={setIsEditMode}
								handleSave={handleSave}
								handleCancel={handleCancel}
								handleProfileChange={handleProfileChange}
								handleAvatarChange={handleAvatarChange}
							/>
						)}
					</div>
				</div>
			</main>

			{/* Floating Quick Match Button */}
			<FloatingQuickMatchButton />
		</div>
	);
}
