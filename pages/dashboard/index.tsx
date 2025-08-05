import Miku, { useState, useEffect } from "Miku";
import { Achievement, User } from "../../types/user.ts";
import {
  Header,
  Navigation,
  TournamentsSection,
  ChatsSection,
  ProfileSection,
  FloatingQuickMatchButton,
  AnimatedBackground,
  Friends,
} from "./components/index.tsx";

export default function DashboardPage({ user, achievements }: { user: User | null, achievements: Achievement[] }) {
  const [activeSection, setActiveSection] = useState("tournaments");
  const [isVisible, setIsVisible] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 90, y: 10 });
  const [notifications, setNotifications] = useState(3);
  const [onlineUsers, setOnlineUsers] = useState(1247);
  const [userStats, setUserStats] = useState({
    wins: user?.gameStats.wins ?? 0,
    losses: user?.gameStats?.losses ?? 0,
    rank: 42,
    winRate: user?.gameStats && user.gameStats.totalGames > 0 ? ((user.gameStats.wins / user.gameStats.totalGames) * 100).toFixed(1) : 0,
  });

  // State for profile editing
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableProfile, setEditableProfile] = useState({
    displayName: "",
    bio: "",
    avatarFile: null as File | null,
    avatarPreview: ""
  });

  // Mock data
  const tournaments = [
    { id: 1, name: "World Championship 2024", status: "live" as const, players: 128, prize: "$10,000", timeLeft: "2h 34m" },
    { id: 2, name: "Speed Masters", status: "upcoming" as const, players: 64, prize: "$5,000", startTime: "Tomorrow 3:00 PM" },
    { id: 3, name: "Rookie League", status: "completed" as const, players: 32, prize: "$1,000", result: "2nd Place" },
  ];

  const chats = [
    { id: 1, name: "Alex Chen", lastMessage: "GG! Great match, rematch later?", time: "2m ago", unread: 2, online: true },
    { id: 2, name: "Tournament Chat", lastMessage: "Sarah: When does the next round start?", time: "5m ago", unread: 0, online: false },
    { id: 3, name: "Maria Rodriguez", lastMessage: "Thanks for the tips on backhand!", time: "1h ago", unread: 1, online: true },
  ];

  useEffect(() => {
    setIsVisible(true);
    // Initialize editable profile state when user data is available
    if (user) {
      setEditableProfile({
        displayName: user.profile?.displayName || "",
        bio: user.profile?.bio || "",
        avatarFile: null,
        avatarPreview: user.profile?.avatar ? `http://localhost:3002/${user.profile.avatar}` : ""
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
  }, [user]);

  // Profile Edit Handlers
  const handleSave = () => {
    console.log("Saving profile:", {
      displayName: editableProfile.displayName,
      bio: editableProfile.bio,
      avatar: editableProfile.avatarFile,
    });
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    if (user) {
      setEditableProfile({
        displayName: user.profile?.displayName || "",
        bio: user.profile?.bio || "",
        avatarFile: null,
        avatarPreview: user.profile?.avatar ? `http://localhost:3002/${user.profile.avatar}` : ""
      });
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditableProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditableProfile(prev => ({
        ...prev,
        avatarFile: file,
        avatarPreview: URL.createObjectURL(file)
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Animated Background Elements */}
      <AnimatedBackground ballPosition={ballPosition} />

      {/* Header */}
      <Header 
        user={user} 
        onlineUsers={onlineUsers} 
        notifications={notifications} 
      />

      {/* Navigation */}
      <Navigation 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
      />

      {/* Main Content */}
      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className={`transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            {activeSection === "tournaments" && <TournamentsSection tournaments={tournaments} />}
            {activeSection === "chats" && <ChatsSection chats={chats} />}
            {activeSection === "friends" && <Friends user={user} />}
            {activeSection === "profile" && (
              <ProfileSection
                user={user}
                achievements={achievements}
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

