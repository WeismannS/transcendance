import { EventType } from "../store/StateManager.ts"

export type User = {
  profile: ProfileOverview;
  gameHistory: GameHistory[];
  gameStats: GameStats;
  achievements: string[]; // Array of achievement IDs
  friends: Friend[];
  friendRequests: {
    sent: FriendRequest[];
    received: FriendRequest[];
  };
};

export interface Profile extends Omit<User, "friends" | "friendRequests"> {
  gamesH2h : GameHistory[];
  overallRecord?: {
    wins: number;
    losses: number;
  }

}
export type GameHistory = {
  id: number;
  playedAt: string;
  result: "win" | "loss" | "draw";
  playerScore: number;
  opponentScore: number;
  opponent: ProfileOverview;
  opponentName: string;
};

export type GameStats = {
  totalGames: number;
  wins: number;
  losses: number;
  tournaments : number;
  tournamentWins: number;
  bestStreak  : number;
  currentStreak: number;
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
  bio : string;
  status: "online" | "offline" | "In Game" | "in Tournament";
  rank: number;
  createdAt: string; // ISO date string
};


export type FriendEvent = | 'FRIEND_REQUEST_RECEIVED'
| 'FRIEND_REQUEST_ACCEPTED'
| 'FRIEND_REQUEST_DECLINED'

export type GameEvent = | 'GAME_INVITE'
| 'GAME_ACCEPTED'
| 'GAME_REJECTED'

export type Notification<T extends EventType> = {
  type: T
  content: string
  title: string
  user: T extends "STATUS_UPDATE" 
    ? ProfileOverview & { isFriend: boolean, isOnline: boolean }
    : T extends (FriendEvent |  GameEvent)  
    ? ProfileOverview 
    : never,
  requestId: T extends "FRIEND_REQUEST_RECEIVED" ? number : never
  gameId : T extends "GAME_INVITE" | "GAME_REJECTED" | "GAME_ACCEPTED" ? string : never
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