export interface Tournament {
  id: string;
  name: string;
  status: "upcoming" | "ongoing" | "done" | "cancelled" | "pending";
  players?: {
    id: string;
    userId: string;
    username: string;
    tournamentId: string;
  }[];
  playersCount: number;
  startTime: string | null;
  createdBy?: string;
  createdAt: string;
  winnerId?: string | null;
  // Computed fields for UI
  prize?: string;
  timeLeft?: string;
  result?: string;
}

export interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

export interface EditableProfile {
  displayName: string;
  bio: string;
  avatarFile: File | null;
  avatarPreview: string;
}

export interface UserStats {
  wins: number;
  losses: number;
  rank: number;
  winRate: string | number;
}
