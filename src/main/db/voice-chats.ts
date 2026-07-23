import { db, rowsOf } from "./client";
import { ensureUser } from "./users";

// the users and roles signed up to be pinged for a channel
export type VoiceChatSignups = {
	userIds: string[];
	roleIds: string[];
};

export const getVoiceChatSignups = async (
	channelId: string,
): Promise<VoiceChatSignups> => {
	const [userRows, roleRows] = await Promise.all([
		db
			.from("voice_chat_users")
			.select("user_id")
			.eq("channel_id", channelId)
			.then(rowsOf),
		db
			.from("voice_chat_roles")
			.select("role_id")
			.eq("channel_id", channelId)
			.then(rowsOf),
	]);
	return {
		userIds: userRows.map((row) => row.user_id),
		roleIds: roleRows.map((row) => row.role_id),
	};
};

// every channel the user is signed up for, across all guilds; callers
// scope the result to a guild by intersecting with its channels
export const getUserVoiceChatSignups = async (
	userId: string,
): Promise<string[]> => {
	const rows = rowsOf(
		await db
			.from("voice_chat_users")
			.select("channel_id")
			.eq("user_id", userId),
	);
	return rows.map((row) => row.channel_id);
};

// role signups for a set of channels (typically one guild's voice channels)
export const getVoiceChatRoleSignups = async (
	channelIds: string[],
): Promise<{ channelId: string; roleId: string }[]> => {
	if (channelIds.length === 0) return [];
	const rows = rowsOf(
		await db
			.from("voice_chat_roles")
			.select("channel_id, role_id")
			.in("channel_id", channelIds),
	);
	return rows.map((row) => ({
		channelId: row.channel_id,
		roleId: row.role_id,
	}));
};

// returns whether the user was newly signed up (false if already signed up)
export const addVoiceChatUser = async (
	channelId: string,
	userId: string,
): Promise<boolean> => {
	await ensureUser(userId);
	const inserted = rowsOf(
		await db
			.from("voice_chat_users")
			.upsert(
				{ channel_id: channelId, user_id: userId },
				{ ignoreDuplicates: true },
			)
			.select("user_id"),
	);
	return inserted.length > 0;
};

// returns whether the user was signed up. Their filter for the channel is
// kept: filters also apply to rings from commands and default ringees, so
// they are meaningful without a signup
export const removeVoiceChatUser = async (
	channelId: string,
	userId: string,
): Promise<boolean> => {
	const deleted = rowsOf(
		await db
			.from("voice_chat_users")
			.delete()
			.eq("channel_id", channelId)
			.eq("user_id", userId)
			.select("user_id"),
	);
	return deleted.length > 0;
};

// returns whether the role was newly signed up (false if already signed up)
export const addVoiceChatRole = async (
	channelId: string,
	roleId: string,
): Promise<boolean> => {
	const inserted = rowsOf(
		await db
			.from("voice_chat_roles")
			.upsert(
				{ channel_id: channelId, role_id: roleId },
				{ ignoreDuplicates: true },
			)
			.select("role_id"),
	);
	return inserted.length > 0;
};

// returns whether the role was signed up
export const removeVoiceChatRole = async (
	channelId: string,
	roleId: string,
): Promise<boolean> => {
	const deleted = rowsOf(
		await db
			.from("voice_chat_roles")
			.delete()
			.eq("channel_id", channelId)
			.eq("role_id", roleId)
			.select("role_id"),
	);
	return deleted.length > 0;
};
