import { db, rowsOf, throwOnError } from "./client";
import { Database } from "./database.types";

export type DiscordUserMode = Database["public"]["Enums"]["discord_user_mode"];

// creates the users row if missing; required before writing any table
// that references users (FK with on delete cascade)
export const ensureUser = async (userId: string): Promise<void> => {
	throwOnError(
		await db
			.from("users")
			.upsert({ user_id: userId }, { ignoreDuplicates: true }),
	);
};

export const getUserMode = async (userId: string): Promise<DiscordUserMode> => {
	const row = throwOnError(
		await db.from("users").select("mode").eq("user_id", userId).maybeSingle(),
	);
	return row?.mode ?? "normal";
};

// missing users default to "normal"
export const getUserModes = async (
	userIds: string[],
): Promise<Map<string, DiscordUserMode>> => {
	const modes = new Map<string, DiscordUserMode>();
	if (userIds.length === 0) return modes;

	const rows = rowsOf(
		await db.from("users").select("user_id, mode").in("user_id", userIds),
	);
	for (const row of rows) modes.set(row.user_id, row.mode);
	return modes;
};

export const setUserMode = async (
	userId: string,
	mode: DiscordUserMode,
): Promise<void> => {
	throwOnError(
		await db
			.from("users")
			.upsert({ user_id: userId, mode }, { onConflict: "user_id" }),
	);
};

// deletes every trace of a user; all per-user tables cascade from users.
// returns whether any data existed
export const deleteAllUserData = async (userId: string): Promise<boolean> => {
	const deletedUsers = rowsOf(
		await db.from("users").delete().eq("user_id", userId).select("user_id"),
	);
	return deletedUsers.length > 0;
};
