import type { EventType, TournamentEvent } from "../store/StateManager.ts";
import type { Achievement } from "./achievement";
import type { Friend, FriendRequest } from "./friend";
import type { GameHistory, GameStats } from "./game";
import type { Conversation, Message } from "./message";
import type { FriendEvent, GameEvent, Notification } from "./notification";
import type { Profile, ProfileOverview } from "./profile";
import type { Tournament } from "./tournament";

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
