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
  friends: ProfileOverview[];
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
  user : ProfileOverview & {lastActive: Date};
  createdAt: Date;
};

export type ProfileOverview = {
  id: number;
  displayName: string;
  avatar: string;
  status: "online" | "offline" | "In Game" | "in Tournament";
  rank: number;
};
