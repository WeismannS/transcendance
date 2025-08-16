import { EventType } from "../src/store/StateManager.ts"

export type User = {
  profile: {
    id: number;
    displayName: string;
    bio: string;
    avatar: string;
  };
  gameHistory: GameHistory[];
  gameStats: GameStats;
  achievements: number[]; // Array of achievement IDs
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
  id: number;
  title: string;
  description: string;
  icon: string;
};

export type FriendRequest = {
  user : Friend
  id : number,
  createdAt: Date;
};

export type Friend = ProfileOverview & {lastActive : Date}
export type ProfileOverview = {
  id: number;
  displayName: string;
  avatar: string;
  status: "online" | "offline" | "In Game" | "in Tournament";
  rank: number;
};


export type FriendEvent = | 'FRIEND_REQUEST_RECEIVED'
| 'FRIEND_REQUEST_ACCEPTED'
| 'FRIEND_REQUEST_DECLINED'


export type Notification<T extends EventType> = {
  type : EventType
  content : string
  title : string
  user : T extends FriendEvent ? ProfileOverview : never
}