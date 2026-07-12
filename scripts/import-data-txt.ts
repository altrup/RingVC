/*
 * One-off import of the legacy data/data.txt store into Supabase.
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/import-data-txt.ts [path/to/data.txt]
 * (the env vars can also come from .env)
 *
 * Idempotent: every write is an upsert, so re-running is safe.
 */
import * as fs from "fs";
import * as path from "path";

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

import { Database } from "@db/database.types";

dotenv.config({ quiet: true });

if (
	process.env.SUPABASE_URL === undefined ||
	process.env.SUPABASE_SERVICE_ROLE_KEY === undefined
) {
	throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}
const db = createClient<Database>(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY,
	{ auth: { persistSession: false } },
);

const dataPath =
	process.argv[2] ?? path.join(process.cwd(), "data", "data.txt");

// ---- legacy format parsing ----
// data.txt is JSON where Maps, users, voice chats, and filters are wrapped in
// { dataType, value } objects by the old serializer

type Wrapped = { dataType: string; value: unknown };

const isWrapped = (value: unknown): value is Wrapped => {
	return (
		typeof value === "object" &&
		value !== null &&
		"dataType" in value &&
		"value" in value &&
		typeof (value as Wrapped).dataType === "string"
	);
};

// unwraps a legacy Map into key -> value entries
const asMap = (value: unknown): Map<string, unknown> => {
	const map = new Map<string, unknown>();
	if (!isWrapped(value) || value.dataType !== "Map") return map;
	if (!Array.isArray(value.value)) return map;
	for (const entry of value.value) {
		if (
			Array.isArray(entry) &&
			entry.length === 2 &&
			typeof entry[0] === "string"
		)
			map.set(entry[0], entry[1]);
	}
	return map;
};

type LegacyFilter = { isWhitelist: boolean; list: string[] };

const asFilter = (value: unknown): LegacyFilter | null => {
	if (!isWrapped(value) || value.dataType !== "VoiceChannelFilter") return null;
	const raw = value.value as { isWhitelist?: unknown; list?: unknown };
	return {
		isWhitelist: raw.isWhitelist === true,
		list: [...asMap(raw.list).keys()],
	};
};

const isDefaultFilter = (filter: LegacyFilter | null): boolean => {
	return !filter || (!filter.isWhitelist && filter.list.length === 0);
};

// ---- import ----

const throwOnError = ({ error }: { error: { message: string } | null }) => {
	if (error) throw new Error(`database error: ${error.message}`);
};

const importData = async () => {
	if (!fs.existsSync(dataPath)) {
		throw new Error(`${dataPath} does not exist`);
	}
	const storedText = fs.readFileSync(dataPath).toString();
	if (storedText === "") {
		console.log(`${dataPath} is empty; nothing to import`);
		return;
	}
	const root = JSON.parse(storedText) as {
		voiceChats?: unknown;
		users?: unknown;
	};

	// voice chats
	let voiceChatCount = 0;
	for (const [channelId, rawVoiceChat] of asMap(root.voiceChats)) {
		if (!isWrapped(rawVoiceChat) || rawVoiceChat.dataType !== "VoiceChat")
			continue;
		const voiceChat = rawVoiceChat.value as {
			userIds?: unknown;
			roleIds?: unknown;
		};
		voiceChatCount++;

		for (const userId of asMap(voiceChat.userIds).keys()) {
			throwOnError(
				await db
					.from("voice_chat_users")
					.upsert(
						{ channel_id: channelId, user_id: userId },
						{ ignoreDuplicates: true },
					),
			);
		}
		for (const roleId of asMap(voiceChat.roleIds).keys()) {
			throwOnError(
				await db
					.from("voice_chat_roles")
					.upsert(
						{ channel_id: channelId, role_id: roleId },
						{ ignoreDuplicates: true },
					),
			);
		}
	}

	// users and their settings
	let userCount = 0;
	for (const [userId, rawUser] of asMap(root.users)) {
		if (!isWrapped(rawUser) || rawUser.dataType !== "DiscordUser") continue;
		const user = rawUser.value as {
			mode?: unknown;
			channelFilters?: unknown;
			voiceChannels?: unknown; // legacy name for channelFilters
			globalFilter?: unknown;
			channelAutoRingEnableds?: unknown;
			globalAutoRingEnabled?: unknown;
			channelDefaultRingeeUserIds?: unknown;
			globalDefaultRingeeUserIds?: unknown;
		};
		userCount++;

		const mode =
			user.mode === "stealth" || user.mode === "auto" ? user.mode : "normal";
		throwOnError(
			await db
				.from("users")
				.upsert({ user_id: userId, mode }, { onConflict: "user_id" }),
		);

		// filters (channel scopes + global as a NULL channel_id)
		const filters = new Map<string | null, LegacyFilter | null>([
			[null, asFilter(user.globalFilter)],
		]);
		for (const [channelId, rawFilter] of asMap(
			user.channelFilters ?? user.voiceChannels,
		))
			filters.set(channelId, asFilter(rawFilter));
		for (const [channelId, filter] of filters) {
			if (isDefaultFilter(filter) || !filter) continue;
			throwOnError(
				await db.from("filters").upsert(
					{
						user_id: userId,
						channel_id: channelId,
						is_whitelist: filter.isWhitelist,
					},
					{ onConflict: "user_id,channel_id" },
				),
			);
			for (const targetUserId of filter.list) {
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
			}
		}

		// auto ring (a false global setting is the default; don't store it)
		if (user.globalAutoRingEnabled === true) {
			throwOnError(
				await db
					.from("auto_ring")
					.upsert(
						{ user_id: userId, channel_id: null, enabled: true },
						{ onConflict: "user_id,channel_id" },
					),
			);
		}
		for (const [channelId, enabled] of asMap(user.channelAutoRingEnableds)) {
			if (typeof enabled !== "boolean") continue;
			throwOnError(
				await db
					.from("auto_ring")
					.upsert(
						{ user_id: userId, channel_id: channelId, enabled },
						{ onConflict: "user_id,channel_id" },
					),
			);
		}

		// default ringees (channel scopes + global as a NULL channel_id)
		const ringees = new Map<string | null, string[]>([
			[null, [...asMap(user.globalDefaultRingeeUserIds).keys()]],
		]);
		for (const [channelId, rawList] of asMap(user.channelDefaultRingeeUserIds))
			ringees.set(channelId, [...asMap(rawList).keys()]);
		for (const [channelId, ringeeUserIds] of ringees) {
			for (const ringeeUserId of ringeeUserIds) {
				throwOnError(
					await db.from("default_ringees").upsert(
						{
							user_id: userId,
							channel_id: channelId,
							ringee_user_id: ringeeUserId,
						},
						{
							onConflict: "user_id,channel_id,ringee_user_id",
							ignoreDuplicates: true,
						},
					),
				);
			}
		}
	}

	console.log(
		`imported ${userCount} users and ${voiceChatCount} voice chats from ${dataPath}`,
	);
};

importData().catch((err) => {
	console.error(err);
	process.exit(1);
});
