
import Miku, { useState, useEffect } from "Miku"
import { Link } from "Miku/Router"
import {
  AnimatedBackground,
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
  const [hasPendingRequest, setHasPendingRequest] = useState(false)

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
      joinDate:  new Date(profile.profile.createdAt).toLocaleDateString(),// This would need to be added to the Profile type
      totalMatches: profile.gameStats.totalGames,
      tournamentsWon: profile.gameStats.tournamentWins,
      xp: profile.gameStats.wins * 100 + profile.gameStats.totalGames * 10,
      overallRecord: {
        wins: profile.overallRecord?.wins || 0,
        losses: profile.overallRecord?.losses || 0,
      },
    }
  }

  // Transform GameHistory to Match format
  const transformGameHistory = (gameHistory: GameHistory[]): Match[] => {
    return gameHistory.map((game, index) => ({
      id: game.id,
      opponent: game.opponentName, // This would need to be added to GameHistory
      result: game.result as "win" | "loss",
      score: `${game.playerScore}-${game.opponentScore}`,
      time: new Date(game.playedAt).toLocaleDateString(),
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

  // Check if there's a pending friend request to this user
  const checkPendingRequest = (userId: string, sentRequests: any[]): boolean => {
    const hasPending = sentRequests.some(request => request.user.id === userId)
    console.log(`Checking pending request for ${userId}:`, hasPending, sentRequests)
    return hasPending
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
              rank: 1, // Default rank, should be in UserProfileState
              createdAt: currentUser.createdAt || new Date().toISOString(), // Use current date if not available
            },
            gameHistory: gameState?.history || [],
            gameStats: gameState?.stats || { totalGames: 0, wins: 0, losses: 0, tournaments: 0, tournamentWins: 0, bestStreak: 0, currentStreak: 0 },
            achievements: achievementsState?.userAchievementIds || [],
            gamesH2h: []
          }
          
          setProfileData(mockProfile)
          setIsFriend(false) // Can't be friends with yourself
          setHasPendingRequest(false) // Can't have pending request to yourself
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
                // Check for pending friend requests
                setHasPendingRequest(checkPendingRequest(profile.profile.id, socialState.friendRequests.sent))
              }
            } else {
              setIsFriend(false) // Can't be friends with yourself
              setHasPendingRequest(false)
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

  // Update friend status and pending requests reactively
  useEffect(() => {
    if (profileData && !isOwnProfile && socialState) {
      setIsFriend(checkFriendship(profileData.profile.id, socialState.friends))
      setHasPendingRequest(checkPendingRequest(profileData.profile.id, socialState.friendRequests.sent))
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
    if (!isOwnProfile && profileUser && !hasPendingRequest) {
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
            // Set pending request state immediately for better UX
            setHasPendingRequest(true)
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
      if (!isFriend) {
        console.log("Cannot send message: User is not a friend")
        return
      }
      
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-cyan-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-pink-400 rounded-full animate-bounce"></div>

          {/* Animated Ping Pong Ball */}
          <div
            className="absolute w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-lg transition-all duration-4000 ease-in-out"
            style={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          ></div>

          {/* Geometric shapes */}
          <div className="absolute top-1/3 right-1/4 w-32 h-32 border border-orange-500/10 rounded-full"></div>
          <div className="absolute bottom-1/3 left-1/4 w-24 h-24 border border-pink-500/10 rounded-full"></div>
        </div>


        <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
          <div className="text-center max-w-lg mx-auto">
            <div
              className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            >
              {/* Loading Card */}
              <div key="loading-card" className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-12 shadow-2xl">
                {/* Loading Spinner */}
                <div key="loading-spinner" className="mb-6">
                  <div className="w-16 h-16 mx-auto border-4 border-gray-600 border-t-orange-500 rounded-full animate-spin"></div>
                </div>
                
                {/* Loading Text */}
                <h2 key="loading-title" className="text-3xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                    Loading Profile
                  </span>
                </h2>
                
                <p key="loading-message" className="text-xl text-gray-300">
                  Fetching player information...
                </p>

                {/* Loading dots animation */}
                <div key="loading-dots" className="flex justify-center space-x-1 mt-6">
                  <div key="dot-1" className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                  <div key="dot-2" className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div key="dot-3" className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profileData || !profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-cyan-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-pink-400 rounded-full animate-bounce"></div>

          {/* Animated Ping Pong Ball */}
          <div
            className="absolute w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-lg transition-all duration-4000 ease-in-out"
            style={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          ></div>

          {/* Geometric shapes */}
          <div className="absolute top-1/3 right-1/4 w-32 h-32 border border-orange-500/10 rounded-full"></div>
          <div className="absolute bottom-1/3 left-1/4 w-24 h-24 border border-pink-500/10 rounded-full"></div>
        </div>


        <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div
              className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            >
              {/* Main Error Card */}
              <div key="main-error-card" className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-12 mb-8 shadow-2xl">
                {/* Pensive Emoji with animation */}
                <div key="pensive-emoji" className="text-8xl mb-6 animate-bounce">😔</div>
                
                {/* Error Title */}
                <h1 key="error-title" className="text-4xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                    Profile Not Found
                  </span>
                </h1>
                
                {/* Error Message */}
                <p key="error-message" className="text-xl text-gray-300 mb-8 leading-relaxed">
                  {error === "Profile not found" || error === null 
                    ? "We couldn't find the profile you're looking for. The user might not exist or the profile may have been removed."
                    : error
                  }
                </p>

                {/* Suggestions Section */}
                <div className="bg-gray-700/30 rounded-xl p-6 mb-8">
                  <h3 key="suggestions-title" className="text-lg font-semibold text-white mb-4">What you can do:</h3>
                  <div key="suggestions-list" className="space-y-3 text-gray-300">
                    <div key="suggestion-1" className="flex items-center space-x-3">
                      <span className="text-orange-400">•</span>
                      <span>Check the URL for any typos</span>
                    </div>
                    <div key="suggestion-2" className="flex items-center space-x-3">
                      <span className="text-orange-400">•</span>
                      <span>Search for the user in the dashboard</span>
                    </div>
                    <div key="suggestion-3" className="flex items-center space-x-3">
                      <span className="text-orange-400">•</span>
                      <span>Browse the leaderboard to find players</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div key="action-buttons" className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    key="dashboard-button"
                    onClick={() => redirect('/dashboard')}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl font-semibold hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
                  >
                    🏠 Go to Dashboard
                  </button>
                  <button
                    key="leaderboard-button"
                    onClick={() => redirect('/leaderboard')}
                    className="px-8 py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all transform hover:scale-105 shadow-lg"
                  >
                    🏆 View Leaderboard
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <AnimatedBackground ballPosition={ballPosition} />

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
              hasPendingRequest={hasPendingRequest}
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
