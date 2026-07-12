import { db, rowsOf } from "./client";
import { resetFilter } from "./filters";

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

// returns whether the user was newly signed up (false if already signed up)
export const addVoiceChatUser = async (
	channelId: string,
	userId: string,
): Promise<boolean> => {
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

// returns whether the user was signed up. Also deletes the user's filter for
// the channel, since it is meaningless without the signup
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
	await resetFilter(userId, channelId);
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
