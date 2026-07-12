import { db, rowsOf } from "./client";
import { scopeFilter } from "./scope";
import { ensureUser } from "./users";

// the ringees for one scope only (a channel, or the global list)
export const getDefaultRingees = async (
	userId: string,
	channelId: string | null,
): Promise<string[]> => {
	const rows = rowsOf(
		await scopeFilter(
			db.from("default_ringees").select("ringee_user_id").eq("user_id", userId),
			channelId,
		),
	);
	return rows.map((row) => row.ringee_user_id);
};

// the global and channel-specific ringees combined, deduplicated
export const getAllDefaultRingees = async (
	userId: string,
	channelId: string,
): Promise<string[]> => {
	const rows = rowsOf(
		await db
			.from("default_ringees")
			.select("ringee_user_id")
			.eq("user_id", userId)
			// channel IDs are Discord snowflakes (digits only), safe to interpolate
			.or(`channel_id.eq.${channelId},channel_id.is.null`),
	);
	return [...new Set(rows.map((row) => row.ringee_user_id))];
};

// returns whether the ringee was newly added
export const addDefaultRingee = async (
	userId: string,
	channelId: string | null,
	ringeeUserId: string,
): Promise<boolean> => {
	await ensureUser(userId);
	const inserted = rowsOf(
		await db
			.from("default_ringees")
			.upsert(
				{
					user_id: userId,
					channel_id: channelId,
					ringee_user_id: ringeeUserId,
				},
				{
					onConflict: "user_id,channel_id,ringee_user_id",
					ignoreDuplicates: true,
				},
			)
			.select("ringee_user_id"),
	);
	return inserted.length > 0;
};

// returns whether the ringee was in the list
export const removeDefaultRingee = async (
	userId: string,
	channelId: string | null,
	ringeeUserId: string,
): Promise<boolean> => {
	const deleted = rowsOf(
		await scopeFilter(
			db
				.from("default_ringees")
				.delete()
				.eq("user_id", userId)
				.eq("ringee_user_id", ringeeUserId),
			channelId,
		).select("ringee_user_id"),
	);
	return deleted.length > 0;
};

// returns whether the list had any ringees
export const clearDefaultRingees = async (
	userId: string,
	channelId: string | null,
): Promise<boolean> => {
	const deleted = rowsOf(
		await scopeFilter(
			db.from("default_ringees").delete().eq("user_id", userId),
			channelId,
		).select("ringee_user_id"),
	);
	return deleted.length > 0;
};
