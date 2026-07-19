import { db, rowsOf, throwOnError } from "./client";
import { scopeFilter } from "./scope";
import { ensureUser } from "./users";

export type FilterType = "whitelist" | "blacklist";

// a user's filter for one scope (a channel, or global when stored with a
// NULL channel_id). A missing filter behaves as an empty blacklist
export type FilterData = {
	isWhitelist: boolean;
	entries: Set<string>;
};

// a user's filters relevant to one channel
export type UserFilters = {
	channel: FilterData | null;
	global: FilterData | null;
};

export const passesFilter = (
	filter: FilterData | null,
	userId: string,
): boolean => {
	if (!filter) return true;
	return filter.isWhitelist === filter.entries.has(userId);
};

export const passesUserFilters = (
	filters: UserFilters | undefined,
	userId: string,
): boolean => {
	if (!filters) return true;
	return (
		passesFilter(filters.channel, userId) &&
		passesFilter(filters.global, userId)
	);
};

export const filterType = (filter: FilterData | null): FilterType => {
	return filter?.isWhitelist ? "whitelist" : "blacklist";
};

export const isDefaultFilter = (filter: FilterData | null): boolean => {
	return !filter || (!filter.isWhitelist && filter.entries.size === 0);
};

// returns null if the user has no filter for this scope
export const getFilter = async (
	userId: string,
	channelId: string | null,
): Promise<FilterData | null> => {
	const row = throwOnError(
		await scopeFilter(
			db.from("filters").select("is_whitelist").eq("user_id", userId),
			channelId,
		).maybeSingle(),
	);
	if (!row) return null;

	const entryRows = rowsOf(
		await scopeFilter(
			db.from("filter_entries").select("target_user_id").eq("user_id", userId),
			channelId,
		),
	);
	return {
		isWhitelist: row.is_whitelist,
		entries: new Set(entryRows.map((entry) => entry.target_user_id)),
	};
};

// fetches the channel and global filters for many users at once (two queries),
// for ring validation. Users without filters are absent from the map
export const getFiltersForUsers = async (
	userIds: string[],
	channelId: string,
): Promise<Map<string, UserFilters>> => {
	const filters = new Map<string, UserFilters>();
	if (userIds.length === 0) return filters;

	// channel IDs are Discord snowflakes (digits only), safe to interpolate
	const scopeCondition = `channel_id.eq.${channelId},channel_id.is.null`;
	const [filterRows, entryRows] = await Promise.all([
		db
			.from("filters")
			.select("user_id, channel_id, is_whitelist")
			.in("user_id", userIds)
			.or(scopeCondition)
			.then(rowsOf),
		db
			.from("filter_entries")
			.select("user_id, channel_id, target_user_id")
			.in("user_id", userIds)
			.or(scopeCondition)
			.then(rowsOf),
	]);

	const getScope = (userId: string, scope: "channel" | "global") => {
		let userFilters = filters.get(userId);
		if (!userFilters) {
			userFilters = { channel: null, global: null };
			filters.set(userId, userFilters);
		}
		if (!userFilters[scope])
			userFilters[scope] = { isWhitelist: false, entries: new Set() };
		return userFilters[scope];
	};

	for (const row of filterRows)
		getScope(
			row.user_id,
			row.channel_id === null ? "global" : "channel",
		).isWhitelist = row.is_whitelist;
	for (const row of entryRows)
		getScope(
			row.user_id,
			row.channel_id === null ? "global" : "channel",
		).entries.add(row.target_user_id);

	return filters;
};

// creates the filter for a scope if missing (as a blacklist), leaving an
// existing filter untouched
const ensureFilter = async (
	userId: string,
	channelId: string | null,
): Promise<void> => {
	await ensureUser(userId);
	throwOnError(
		await db
			.from("filters")
			.upsert(
				{ user_id: userId, channel_id: channelId, is_whitelist: false },
				{ onConflict: "user_id,channel_id", ignoreDuplicates: true },
			),
	);
};

export const addFilterEntry = async (
	userId: string,
	channelId: string | null,
	targetUserId: string,
): Promise<void> => {
	await ensureFilter(userId, channelId);
	throwOnError(
		await db.from("filter_entries").upsert(
			{
				user_id: userId,
				channel_id: channelId,
				target_user_id: targetUserId,
			},
			{
				onConflict: "user_id,channel_id,target_user_id",
				ignoreDuplicates: true,
			},
		),
	);
};

// returns whether the entry existed
export const removeFilterEntry = async (
	userId: string,
	channelId: string | null,
	targetUserId: string,
): Promise<boolean> => {
	const deleted = rowsOf(
		await scopeFilter(
			db
				.from("filter_entries")
				.delete()
				.eq("user_id", userId)
				.eq("target_user_id", targetUserId),
			channelId,
		).select("target_user_id"),
	);
	return deleted.length > 0;
};

// sets the filter type, keeping its entries (the same list is reinterpreted:
// a blacklist's blocked users become a whitelist's allowed users)
export const setFilterType = async (
	userId: string,
	channelId: string | null,
	isWhitelist: boolean,
): Promise<void> => {
	await ensureUser(userId);
	throwOnError(
		await db
			.from("filters")
			.upsert(
				{ user_id: userId, channel_id: channelId, is_whitelist: isWhitelist },
				{ onConflict: "user_id,channel_id" },
			),
	);
};

// deletes the filter for a scope entirely (back to the default: an empty
// blacklist). Returns whether anything was deleted
export const resetFilter = async (
	userId: string,
	channelId: string | null,
): Promise<boolean> => {
	const deletedEntries = rowsOf(
		await scopeFilter(
			db.from("filter_entries").delete().eq("user_id", userId),
			channelId,
		).select("target_user_id"),
	);
	const deletedFilters = rowsOf(
		await scopeFilter(
			db.from("filters").delete().eq("user_id", userId),
			channelId,
		).select("is_whitelist"),
	);
	// a filter row set to whitelist counts as non-default even when empty
	return (
		deletedEntries.length > 0 ||
		deletedFilters.some((filter) => filter.is_whitelist)
	);
};
