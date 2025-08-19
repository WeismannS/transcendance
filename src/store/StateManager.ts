import { Notification } from "../../pages/use-notification.tsx";
import { User, GameHistory, GameStats, Achievement, Friend, FriendRequest, ProfileOverview, Conversation, Message } from "../../types/user.ts";
import { initializeChatWebSocket, initializeNotificationWs, isOnline } from "../services/api.ts";

// State Fragments based on your User schema
export interface UserIdentityState {
  id: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface UserProfileState {
  id: string;
  displayName: string;
  bio: string;
  avatar: string;
}

export interface GameState {
  stats: GameStats;
  history: GameHistory[];
  currentGame?: any; // For active games
}

export interface SocialState {
  friends: Friend[];
  friendRequests: {
    sent: FriendRequest[];
    received: FriendRequest[];
  };
  onlineUsers: number;
}

export interface AchievementsState {
  allAchievements: Achievement[];
  userAchievementIds: string[];
}

export interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
}

export interface WebSocketState {
  wsChat: WebSocket | null;
  wsNotifications: WebSocket | null;
}
export interface MessagesState {
  conversations: Conversation[];
  unreadCount: number;
  activeChat?: string;
}

// Event Types
export type EventType = 
  | 'USER_DATA_LOADED'
  | 'GAME_FINISHED' 
  | 'FRIEND_REQUEST_SENT' 
  | 'FRIEND_REQUEST_RECEIVED'
  | 'FRIEND_REQUEST_ACCEPTED'
  | 'FRIEND_REQUEST_DECLINED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_SENT'
  | 'CONVERSATION_READ'
  | 'PROFILE_UPDATED'
  | 'NOTIFICATION_ADDED'
  | "CONVERSATION_ADDED"
  | "STATUS_UPDATE" 
  | "CONVERSATIONS_LOADED"
  | "FRIEND_REMOVED"

interface StateEvent {
  type: EventType;
  payload: any;
  timestamp: number;
}

type StateKey = 'auth' | 'userIdentity' | 'userProfile' | 'gameState' | 'social' | 'achievements' | 'notifications' | 'messages' | 'webSocket';

class StateManager {
  private states: Map<StateKey, any> = new Map();
  private listeners: Map<StateKey, Set<(state: any) => void>> = new Map();
  private eventListeners: Map<EventType, Set<(payload: any) => void>> = new Map();

  // State management
  setState<T>(key: StateKey, state: T) {
    this.states.set(key, state);
    this.notifyStateListeners(key, state);
  }

  getState<T>(key: StateKey): T | null {
    return this.states.get(key) || null;
  }

  updateState<T>(key: StateKey, updater: (prev: T) => T) {
    const current = this.getState<T>(key);
    if (current) {
      const updated = updater(current);
      this.setState(key, updated);
    }
  }

  // Subscriptions
  subscribe<T>(key: StateKey, callback: (state: T) => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  // Event bus
  emit(type: EventType, payload: any) {
    const event: StateEvent = {
      type,
      payload,
      timestamp: Date.now()
    };

    console.log('StateManager Event:', event);

    this.handleCrossStateEvents(event);

    this.eventListeners.get(type)?.forEach(callback => callback(payload));
  }

  onEvent(type: EventType, callback: (payload: any) => void) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(callback);

    return () => {
      this.eventListeners.get(type)?.delete(callback);
    };
  }

  // Initialize states from User object
  async initializeFromUser(user: User, achievements: Achievement[]) {
    this.setState<UserIdentityState>('userIdentity', {
      id: user.profile.id,
      isOnline: true,
      lastSeen: new Date()
    });

    this.setState<WebSocketState>('webSocket', {
      wsChat : await initializeChatWebSocket(),
      wsNotifications: await initializeNotificationWs(),
    });

    this.setState<UserProfileState>('userProfile', user.profile);

    this.setState<GameState>('gameState', {
      stats: user.gameStats,
      history: user.gameHistory,
      currentGame: undefined
    });

    this.setState<SocialState>('social', {
      friends: user.friends,
      friendRequests: user.friendRequests,
      onlineUsers: 1247 // This would come from server
    });

    this.setState<AchievementsState>('achievements', {
      allAchievements: achievements,
      userAchievementIds: user.achievements
    });

    this.setState<NotificationsState>('notifications', {
      notifications: [],
      unreadCount: 0
    });

    this.setState<MessagesState>('messages', {
      conversations: [],
      unreadCount: 0,
      activeChat: undefined
    });
    this.setState('messages', { conversations: [], unreadCount: 0, activeChat: undefined });

    this.emit('USER_DATA_LOADED', { user, achievements });
  }

  private notifyStateListeners(key: StateKey, state: any) {
    this.listeners.get(key)?.forEach(callback => callback(state));
  }

  private handleCrossStateEvents(event: StateEvent) {
    switch (event.type) {
      case 'GAME_FINISHED':
        this.updateGameStats(event.payload);
        this.checkForAchievements(event.payload);
        break;
        
      case 'FRIEND_REQUEST_SENT':
        this.addSentFriendRequest(event.payload);
        break;

      case 'FRIEND_REQUEST_RECEIVED':
        this.addReceivedFriendRequest(event.payload);
        this.addNotification({
          id: Date.now(),
          type: 'friend_request',
          message: `${event.payload.user.displayName} sent you a friend request`,
          timestamp: new Date()
        });
        break;
        
      case 'FRIEND_REQUEST_ACCEPTED':
        this.acceptFriendRequest(event.payload);
        this.addNotification({
          id: Date.now(),
          type: 'friend_accepted',
          message: `You are now friends with ${event.payload.user.displayName}`,
          timestamp: new Date()
        });
        break;

      case 'FRIEND_REQUEST_DECLINED':
        this.declineFriendRequest(event.payload);
        break;
        
      case 'ACHIEVEMENT_UNLOCKED':
        this.unlockAchievement(event.payload);
        this.addNotification({
          id: Date.now(),
          type: 'achievement',
          message: `Achievement unlocked: ${event.payload.title}`,
          timestamp: new Date()
        });
        break;

      case 'PROFILE_UPDATED':
        this.updateProfile(event.payload);
        break;
      case 'STATUS_UPDATE' :
        console.log(event.payload)
        this.updateStatus(event.payload.user);
        break;
      case 'CONVERSATIONS_LOADED':
        this.setConversations(event.payload);
        break;
      case 'MESSAGE_RECEIVED':
        this.addMessage(event.payload);
        break;
      case 'MESSAGE_SENT':
        console.error("Message sent:", event.payload);
        this.addSentMessage(event.payload);
        break;
      case 'CONVERSATION_READ':
        this.markConversationAsRead(event.payload.conversationId);
        break;
      case "FRIEND_REMOVED" :
        this.updateState<SocialState>('social', (prev) => ({
          ...prev,
          friends: prev.friends.filter(friend => friend.id !== event.payload.user.id)
        }));
        break;
      case 'CONVERSATION_ADDED':
        this.updateState<MessagesState>('messages', (prev) => ({
          ...prev,
          conversations: [...prev.conversations, event.payload.conversation],
          unreadCount: prev.unreadCount + (event.payload.conversation.unreadCount || 0)
        }));
        break;
    }
  }

  private updateGameStats(gameResult: any) {
    this.updateState<GameState>('gameState', (prev) => {
      const newStats = {
        ...prev.stats,
        totalGames: prev.stats.totalGames + 1,
        wins: prev.stats.wins + (gameResult.result === 'win' ? 1 : 0),
        losses: prev.stats.losses + (gameResult.result === 'loss' ? 1 : 0)
      };

      return {
        ...prev,
        stats: newStats,
        history: [gameResult, ...prev.history.slice(0, 49)] // Keep last 50 games
      };
    });
  }
  private updateStatus(user : ProfileOverview & {isFriend : boolean, isOnline : boolean})
  {
    console.error("Updating status for user:", user);
    
    // Update social state (friends)
    this.updateState<SocialState>('social', (prev) => {
      const updatedFriends = prev.friends.map(friend => 
        friend.id === user.id ? (console.log("Found"), { ...friend,  status : user.isOnline ? "online" : "offline" as Friend["status"] }) : friend
      );
    
      const updatedReceivedRequests = prev.friendRequests.received.map(req => 
        req.user.id === user.id ? { ...req, user: { ...req.user, isOnline: user.isOnline } } : req
      );

      return {
        ...prev,
        friends: updatedFriends,
        friendRequests: {
          ...prev.friendRequests,
          received: updatedReceivedRequests
        }
      };
    });

    // Update conversations (chat members)
    this.updateState<MessagesState>('messages', (prev) => ({
      ...prev,
      conversations: prev.conversations.map(conv => ({
        ...conv,
        members: conv.members.map(member => 
          member.id === user.id 
            ? { ...member, status: user.isOnline ? "online" : "offline" as const }
            : member
        )
      }))
    }));
  }
  private addSentFriendRequest(payload: any) {
    this.updateState<SocialState>('social', (prev) => ({
      ...prev,
      friendRequests: {
        ...prev.friendRequests,
        sent: [...prev.friendRequests.sent, payload]
      }
    }));
  }

  private addReceivedFriendRequest(payload: any) {
    console.error(payload)
    this.updateState<SocialState>('social', (prev) => ({
      ...prev,
      friendRequests: {
        ...prev.friendRequests,
        received: [...prev.friendRequests.received, payload]
      }
    }));
  }

  private async acceptFriendRequest(payload: any) {
    console.error("Accepting friend request:", payload);
    const user = payload.user || payload.friend;
    user.status = (await isOnline(user.id)) ? "online" : "offline";
    this.updateState<SocialState>('social', (prev) => ({
      ...prev,
      friends: [...prev.friends, payload.user],
      friendRequests: {
        sent: prev.friendRequests.sent.filter(req => req.user.id !==  user.id),
        received: prev.friendRequests.received.filter(req => req.user.id !== user.id)
      }
    }));
  }

  private setConversations(conversations: Conversation[]) {
    this.updateState<MessagesState>('messages', (prev) => ({
      ...prev,
      conversations: conversations,
      unreadCount: conversations.reduce(
        (count, conv) => count + (typeof conv.unreadCount === "number" ? conv.unreadCount : 0),
        0
      )
    }));
  }
  private declineFriendRequest(payload: any) {
    console.error("Declining friend request:", payload);
    const user = payload.user || payload.friend;
    this.updateState<SocialState>('social', (prev) => ({
      ...prev,
      friendRequests: {
        ...prev.friendRequests,
        received: prev.friendRequests.received.filter(req => req.user.id !== user.id),
        sent: prev.friendRequests.sent.filter(req => req.user.id !== user.id)
      }
    }));
  }

  private unlockAchievement(achievement: Achievement) {
    this.updateState<AchievementsState>('achievements', (prev) => ({
      ...prev,
      userAchievementIds: [...prev.userAchievementIds, achievement.id]
    }));
  }

  private updateProfile(profileData: Partial<UserProfileState>) {
    this.updateState<UserProfileState>('userProfile', (prev) => ({
      ...prev,
      ...profileData
    }));
  }
private addMessage(message: Message) {
  console.error("Adding sent message:", message);
  this.updateState<MessagesState>('messages', (prev) => {
    const updatedConversations = prev.conversations.map(conv =>
      conv.id == message.convoId
        ? {
            ...conv,
            messages: [...conv.messages, { ...message, createdAt: new Date(message.createdAt) }],
            lastMessage: { ...message, createdAt: new Date(message.createdAt) }
          }
        : conv
    );

    // Sort conversations to put the updated one first
    const sortedConversations = updatedConversations.sort((a, b) => {
      // Check if this conversation was just updated
      const aHasReceiver = a.members.find(member => member.id === message.receiverId);
      const bHasReceiver = b.members.find(member => member.id === message.receiverId);
      
      if (aHasReceiver && !bHasReceiver) return -1;
      if (!aHasReceiver && bHasReceiver) return 1;
      
      // If neither or both have the receiver, sort by lastMessage timestamp
      const aTime = new Date(a.lastMessage?.createdAt || 0).getTime();
      const bTime = new Date(b.lastMessage?.createdAt || 0).getTime();
      return bTime - aTime;
    });

    return {
      ...prev,
      conversations: sortedConversations
    };
  });
}

private addSentMessage(payload: { message: Message, receiverId: string }) {
  console.error("Adding sent message:", payload);
  this.updateState<MessagesState>('messages', (prev) => {
    const updatedConversations = prev.conversations.map(conv =>
      conv.members.find(member => member.id === payload.receiverId)?.id
        ? {
            ...conv,
            messages: [...conv.messages, { ...payload.message, createdAt: new Date(payload.message.createdAt) }],
            lastMessage: { ...payload.message, createdAt: new Date(payload.message.createdAt) }
          }
        : conv
    );

    const sortedConversations = updatedConversations.sort((a, b) => {
      const aHasReceiver = a.members.find(member => member.id === payload.receiverId);
      const bHasReceiver = b.members.find(member => member.id === payload.receiverId);
      
      if (aHasReceiver && !bHasReceiver) return -1;
      if (!aHasReceiver && bHasReceiver) return 1;
      
      const aTime = new Date(a.lastMessage?.createdAt || 0).getTime();
      const bTime = new Date(b.lastMessage?.createdAt || 0).getTime();
      return bTime - aTime;
    });

    return {
      ...prev,
      conversations: sortedConversations
    };
  });
}

  private markConversationAsRead(conversationId: string) {
    this.updateState<MessagesState>('messages', (prev) => ({
      ...prev,
      conversations: prev.conversations.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ),
      unreadCount: prev.conversations.reduce(
        (total, conv) => total + (conv.id === conversationId ? 0 : conv.unreadCount),
        0
      )
    }));
  }

  private addNotification(notification: any) {
    this.updateState<NotificationsState>('notifications', (prev) => ({
      ...prev,
      notifications: [notification, ...prev.notifications],
      unreadCount: prev.unreadCount + 1
    }));
  }

  private checkForAchievements(gameResult: any) {
    const gameState = this.getState<GameState>('gameState');
    const achievements = this.getState<AchievementsState>('achievements');
    
    if (!gameState || !achievements) return;

    // Example achievement checks
    if (gameState.stats.wins === 10 && !achievements.userAchievementIds.includes('1')) {
      const achievement = achievements.allAchievements.find(a => a.id === '1');
      if (achievement) {
        this.emit('ACHIEVEMENT_UNLOCKED', achievement);
      }
    }

    if (gameState.stats.totalGames === 1 && !achievements.userAchievementIds.includes('2')) {
      const achievement = achievements.allAchievements.find(a => a.id === '2');
      if (achievement) {
        this.emit('ACHIEVEMENT_UNLOCKED', achievement);
      }
    }
  }
}

export const stateManager = new StateManager();
