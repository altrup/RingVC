import { db, rowsOf, throwOnError } from "./client";
import { ensureUser } from "./users";

// the raw override for a scope (null channel_id = global); undefined if unset
export const getAutoRingSetting = async (
	userId: string,
	channelId: string | null,
): Promise<boolean | undefined> => {
	const query = db.from("auto_ring").select("enabled").eq("user_id", userId);
	const row = throwOnError(
		await (
			channelId === null
				? query.is("channel_id", null)
				: query.eq("channel_id", channelId)
		).maybeSingle(),
	);
	return row?.enabled;
};

// the effective setting: channel override if present, else global, else off
export const isAutoRingEnabled = async (
	userId: string,
	channelId: string,
): Promise<boolean> => {
	const rows = rowsOf(
		await db
			.from("auto_ring")
			.select("channel_id, enabled")
			.eq("user_id", userId)
			// channel IDs are Discord snowflakes (digits only), safe to interpolate
			.or(`channel_id.eq.${channelId},channel_id.is.null`),
	);
	const channelRow = rows.find((row) => row.channel_id !== null);
	if (channelRow) return channelRow.enabled;
	return rows.find((row) => row.channel_id === null)?.enabled ?? false;
};

// returns whether the value changed
export const setAutoRing = async (
	userId: string,
	channelId: string | null,
	enabled: boolean,
): Promise<boolean> => {
	const current = await getAutoRingSetting(userId, channelId);
	// for the global scope, an unset value behaves as false
	if (
		current === enabled ||
		(channelId === null && current === undefined && !enabled)
	)
		return false;

	await ensureUser(userId);
	throwOnError(
		await db
			.from("auto_ring")
			.upsert(
				{ user_id: userId, channel_id: channelId, enabled },
				{ onConflict: "user_id,channel_id" },
			),
	);
	return true;
};

// removes a channel override; returns whether one existed
export const unsetAutoRing = async (
	userId: string,
	channelId: string,
): Promise<boolean> => {
	const deleted = rowsOf(
		await db
			.from("auto_ring")
			.delete()
			.eq("user_id", userId)
			.eq("channel_id", channelId)
			.select("enabled"),
	);
	return deleted.length > 0;
};
