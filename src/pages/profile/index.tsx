
import Miku, { useState, useEffect } from "Miku"
import { Link } from "Miku/Router"
import {
  AnimatedBackground,
  Header,
  ProfileHeader,
  TabNavigation,
  OverviewTab,
  MatchesTab,
  AchievementsTab,
  TournamentsTab,
  ProfileUser,
  Match,
  Achievement,
  Tournament,
  MutualMatch,
  Tab,
} from "./components/index.tsx"
import { getProfileByUsername, sendFriendRequest, removeFriend, getOrCreateConversation } from "../../services/api.ts"
import { stateManager } from "../../store/StateManager.ts"
import { Profile, GameHistory, Achievement as UserAchievement, Friend } from "../../types/user.ts"
import { UserProfileState, SocialState, AchievementsState, GameState, MessagesState } from "../../store/StateManager.ts"
import { redirect } from "Miku/Router"

export default function UserProfilePage({isLoggedIn}: {isLoggedIn: boolean}) {
  console.log("UserProfilePage rendered with isLoggedIn:", stateManager.getState<SocialState>('social')?.friends, isLoggedIn)
  const [isVisible, setIsVisible] = useState(false)
  const [ballPosition, setBallPosition] = useState({ x: 20, y: 80 })
  const [activeTab, setActiveTab] = useState("overview")
  const [isFriend, setIsFriend] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [profileData, setProfileData] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  // Get state manager data - these will remain reactive
  const currentUser = stateManager.getState<UserProfileState>('userProfile')
  const gameState = stateManager.getState<GameState>('gameState')
  const socialState = stateManager.getState<SocialState>('social')
  const achievementsState = stateManager.getState<AchievementsState>('achievements')

  // Extract username from URL - handle both /profile/username and /app_home patterns
  const getUsername = () => {
    const pathSegments = window.location.pathname.split('/').filter(segment => segment)
    
    // If path is /profile/:userid
    if (pathSegments[0] === 'profile' && pathSegments[1]) {
      return pathSegments[1]
    }
    
    // If path is /app_home, return current user
    if (pathSegments[0] === 'app_home') {
      return currentUser?.displayName.toLowerCase().replace(/\s+/g, '') || currentUser?.id || null
    }
    
    return null
  }

  // Transform Profile data to ProfileUser for components
  const transformProfileData = (profile: Profile, achievements: UserAchievement[]): ProfileUser => {
    const winRate = profile.gameStats.totalGames > 0 
      ? (profile.gameStats.wins / profile.gameStats.totalGames) * 100 
      : 0
    
    return {
      id: profile.profile.id,
      avatar : profile.profile.avatar ,
      name: profile.profile.displayName,
      username: `@${profile.profile.displayName.toLowerCase().replace(/\s+/g, '')}`,
      rank: profile.profile.rank,
      level: Math.floor(profile.gameStats.totalGames / 10) + 1, // Simple level calculation
      wins: profile.gameStats.wins,
      losses: profile.gameStats.losses,
      winRate: Math.round(winRate * 10) / 10,
      winStreak: profile.gameStats.currentStreak,
      currentStreak: profile.gameStats.currentStreak,
      bestStreak: profile.gameStats.bestStreak,
      joinDate: "Unknown", // This would need to be added to the Profile type
      country: "� Unknown",
      favoriteTable: "Classic",
      playStyle: "Balanced",
      totalMatches: profile.gameStats.totalGames,
      tournamentsWon: profile.gameStats.tournamentWins,
      xp: profile.gameStats.wins * 100 + profile.gameStats.totalGames * 10,
    }
  }

  // Transform GameHistory to Match format
  const transformGameHistory = (gameHistory: GameHistory[]): Match[] => {
    return gameHistory.map((game, index) => ({
      id: game.id,
      opponent: "Unknown Player", // This would need to be added to GameHistory
      result: game.result as "win" | "loss",
      score: `${game.playerScore}-${game.opponentScore}`,
      time: new Date(game.playedAt).toLocaleDateString(),
      duration: "Unknown", // This would need to be added to GameHistory
    }))
  }

  // Transform achievements
  const transformAchievements = (userAchievementIds: string[], allAchievements: UserAchievement[]): Achievement[] => {
    return allAchievements.map(achievement => ({
      name: achievement.title,
      icon: achievement.icon,
      description: achievement.description,
      unlocked: userAchievementIds.includes(achievement.id)
    }))
  }

  // Check if user is a friend
  const checkFriendship = (userId: string, friends: Friend[]): boolean => {
    return friends.some(friend => friend.id === userId)
  }

  // Extract and memoize username
  const username = getUsername()

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError(null)
      
      if (!username) {
        setError("Invalid profile URL")
        setLoading(false)
        return
      }

      try {
        // Debug logging
        console.log("Profile detection:", {
          username,
          currentUserId: currentUser?.id,
          currentUserDisplayName: currentUser?.displayName,
          pathname: window.location.pathname
        })

        // Check if this is the current user's profile - match by ID
        const isOwn = currentUser && (
          currentUser.id === username || // Direct ID match
          window.location.pathname === '/app_home' // Always own profile for /app_home
        )
        setIsOwnProfile(!!isOwn)

        console.log("Is own profile:", isOwn)

        if (isOwn && currentUser) {
          // Use current user data from state manager
          const mockProfile: Profile = {
            profile: {
              ...currentUser,
              status: "online" as const,
              rank: 1 // Default rank, should be in UserProfileState
            },
            gameHistory: gameState?.history || [],
            gameStats: gameState?.stats || { totalGames: 0, wins: 0, losses: 0, tournaments: 0, tournamentWins: 0, bestStreak: 0, currentStreak: 0 },
            achievements: achievementsState?.userAchievementIds || [],
            gamesH2h: []
          }
          
          setProfileData(mockProfile)
          setIsFriend(false) // Can't be friends with yourself
          setIsOnline(true) // Current user is always online
        } else {
          // Fetch external user profile
          const profile = await getProfileByUsername(username)
          if (profile) {
            setProfileData(profile)
            
            // Double check if this is actually the current user's profile by ID
            const isActuallyOwnProfile = currentUser && currentUser.id === profile.profile.id
            setIsOwnProfile(!!isActuallyOwnProfile)
            
            if (!isActuallyOwnProfile) {
              // Check if this user is a friend
              console.log("friends ", socialState)
              if (socialState) {
                console.log(socialState.friends)
                setIsFriend(checkFriendship(profile.profile.id, socialState.friends))
              }
            } else {
              setIsFriend(false) // Can't be friends with yourself
            }
            
            // Check online status (you'd need to implement this)
            setIsOnline(profile.profile.status === "online")
          } else {
            setError("Profile not found")
          }
        }
      } catch (err) {
        console.error("Failed to load profile:", err)
        setError("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [isLoggedIn, username, currentUser?.id]) // Re-run when username or current user ID changes

  // Update friend status reactively
  useEffect(() => {
    if (profileData && !isOwnProfile && socialState) {
      setIsFriend(checkFriendship(profileData.profile.id, socialState.friends))
    }
  }, [profileData, isOwnProfile, socialState])

  // Update own profile data reactively
  useEffect(() => {
    if (isOwnProfile && currentUser && gameState && achievementsState) {
      const updatedProfile: Profile = {
        profile: {
          ...currentUser,
          status: "online" as const,
          rank: 1
        },
        gameHistory: gameState.history || [],
        gameStats: gameState.stats || { totalGames: 0, wins: 0, losses: 0, tournaments: 0, tournamentWins: 0, bestStreak: 0, currentStreak: 0 },
        achievements: achievementsState.userAchievementIds || [],
        gamesH2h: []
      }
      setProfileData(updatedProfile)
    }
  }, [isOwnProfile, currentUser, gameState, achievementsState])

  // Get transformed data
  const profileUser = profileData && achievementsState ? 
    transformProfileData(profileData, achievementsState.allAchievements || []) : null

  const recentMatches: Match[] = profileData ? transformGameHistory(profileData.gameHistory.slice(0, 10)) : []

  const achievements: Achievement[] = profileData && achievementsState ? 
    transformAchievements(profileData.achievements, achievementsState.allAchievements) : []

  const tournamentHistory: Tournament[] = [
    // Mock tournament data - you'd need to add this to your Profile type
  ]

  const mutualHistory: MutualMatch[] = profileData ? profileData.gamesH2h.map((game, index) => ({
    id: index,
    result: game.result as "win" | "loss",
    score: `${game.playerScore}-${game.opponentScore}`,
    date: new Date(game.playedAt).toLocaleDateString(),
  })) : []

  const tabs: Tab[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "matches", label: "Recent Matches", icon: "🏓" },
    { id: "achievements", label: "Achievements", icon: "🏆" },
    { id: "tournaments", label: "Tournaments", icon: "👑" },
  ]

  useEffect(() => {
    if (!loading) {
      setIsVisible(true)

      // Animated ping pong ball
      const ballInterval = setInterval(() => {
        setBallPosition((prev) => ({
          x: Math.random() * 70 + 15,
          y: Math.random() * 60 + 20,
        }))
      }, 4000)

      return () => {
        clearInterval(ballInterval)
      }
    }
  }, [loading])

  const handleFriendToggle = async () => {
    if (!isOwnProfile && profileUser) {
      try {
        if (isFriend) {
          // Remove friend
          const success = await removeFriend(profileUser.id)
          if (success) {
            setIsFriend(false)
          }
        } else {
          // Send friend request
          const success = await sendFriendRequest(profileUser.id, profileUser.name)
          if (success) {
            // Note: This doesn't immediately make them a friend, just sends a request
            console.log("Friend request sent!")
          }
        }
      } catch (error) {
        console.error("Error toggling friend status:", error)
      }
    }
  }

  const handleChallenge = () => {
    if (profileUser) {
      console.log("Challenge sent to", profileUser.name)
      // Here you would implement the challenge functionality
    }
  }

  const handleMessage = async () => {
    if (!isOwnProfile && profileUser) {
      try {
        // Create or get conversation with this user
        const conversation = await getOrCreateConversation(profileUser.id)
        
        if (conversation) {
          // Set active chat in state manager
          const messagesState = stateManager.getState<MessagesState>('messages')
          if (messagesState) {
            stateManager.setState<MessagesState>('messages', {
              ...messagesState,
              activeChat: conversation.id
            })
          }
          
          // Store the target section in a way the dashboard can pick it up
          // We'll use sessionStorage for this
          sessionStorage.setItem('dashboardActiveSection', 'chats')
          
          // Redirect to dashboard
          redirect('/dashboard')
        }
      } catch (error) {
        console.error("Error opening message:", error)
      }
    }
  }

  const handleEditProfile = () => {
    if (isOwnProfile) {
      // Store the target section and edit mode in sessionStorage
      sessionStorage.setItem('dashboardActiveSection', 'profile')
      sessionStorage.setItem('dashboardEditMode', 'true')
      
      // Redirect to dashboard
      redirect('/dashboard')
    }
  }

  const renderTabContent = () => {
    if (!profileUser) return null

    switch (activeTab) {
      case "overview":
        return <OverviewTab profileUser={profileUser} mutualHistory={mutualHistory} />
      case "matches":
        return <MatchesTab recentMatches={recentMatches} />
      case "achievements":
        return <AchievementsTab achievements={achievements} />
      case "tournaments":
        return <TournamentsTab tournamentHistory={tournamentHistory} />
      default:
        return <OverviewTab profileUser={profileUser} mutualHistory={mutualHistory} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-2xl">Loading profile...</div>
      </div>
    )
  }

  if (error || !profileData || !profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-2xl text-red-400">{error || "Profile not found"}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <AnimatedBackground ballPosition={ballPosition} />
      <Header />

      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div
            className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <ProfileHeader
              profileUser={profileUser}
              isOnline={isOnline}
              isFriend={isFriend}
              isOwnProfile={isOwnProfile}
              onFriendToggle={handleFriendToggle}
              onChallenge={handleChallenge}
              onMessage={handleMessage}
              onEditProfile={handleEditProfile}
            />

            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

            <div className="transition-all duration-300">{renderTabContent()}</div>
          </div>
        </div>
      </main>
    </div>
  )
}
