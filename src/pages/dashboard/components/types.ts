import type { Tournament } from "../../../types/user";

export type { Tournament };

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
