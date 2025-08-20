import { EventType } from "../store/StateManager.ts"

export type User = {
  profile: {
    id: string;
    displayName: string;
    bio: string;
    avatar: string;
  };
  gameHistory: GameHistory[];
  gameStats: GameStats;
  achievements: string[]; // Array of achievement IDs
  friends: Friend[];
  friendRequests: {
    sent: FriendRequest[];
    received: FriendRequest[];
  };
};

export type GameHistory = {
  id: number;
  playedAt: string;
  result: "win" | "loss" | "draw";
  playerScore: number;
  opponentScore: number;
};

export type GameStats = {
  totalGames: number;
  wins: number;
  losses: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type FriendRequest = {
  user : Friend
  id : string,
  createdAt: Date;
};

export type Friend = ProfileOverview & {lastActive : Date}
export type ProfileOverview = {
  id: string;
  displayName: string;
  avatar: string;
  status: "online" | "offline" | "In Game" | "in Tournament";
  rank: number;
};


export type FriendEvent = | 'FRIEND_REQUEST_RECEIVED'
| 'FRIEND_REQUEST_ACCEPTED'
| 'FRIEND_REQUEST_DECLINED'


export type Notification<T extends EventType> = {
  type: T
  content: string
  title: string
  user: T extends "STATUS_UPDATE" 
    ? ProfileOverview & { isFriend: boolean, isOnline: boolean }
    : T extends "FRIEND_REQUEST_RECEIVED" | "FRIEND_REQUEST_ACCEPTED" | "FRIEND_REQUEST_DECLINED"
    ? ProfileOverview 
    : never,
  requestId: T extends "FRIEND_REQUEST_RECEIVED" ? number : never
}

export function isNotificationType<T extends EventType>(
  data: any, 
  type: T
): data is Notification<T> {
  return data && data.type === type;
}


export type Message = {
  id: string;
  senderId: string;
  content: string;
  receiverId: string;
  createdAt: Date;
  convoId : string; // Optional for direct messages
}

export type Conversation = {
  id : string;
  members : ProfileOverview[];
  messages: Message[];
  unreadCount: number;
  lastMessage: Message | null;
}