import { flashRedirect } from "@routes/lib/flash";
import { Handler } from "@routes/types";

import { removeVoiceChatRole } from "@db/voice-chats";
import { joinWithAnd, mentionRole } from "@main/ring";

import {
	canManageRoleSignups,
	mentionChannel,
	ROLES,
	sortedRoleSignups,
} from "../../_shared";

// a remove-select value decodes to "<path>?pair=<roleId>:<channelId>"
const pairOf = (
	value: string,
): { roleId: string; channelId: string } | null => {
	const [, query = ""] = value.split("?");
	const [roleId, channelId] =
		new URLSearchParams(query).get("pair")?.split(":") ?? [];
	return roleId && channelId ? { roleId, channelId } : null;
};

// serves the panel's remove select and the /unsignuprole adapter (role and
// optional channel as query params; no channel removes the role everywhere)
export const signupsRolesRemovePost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const guild = interaction.guild;
	if (!guild)
		return flashRedirect(
			ROLES,
			"Signups only work inside a Discord server",
			"warn",
		);
	if (!canManageRoleSignups(interaction))
		return flashRedirect(
			ROLES,
			"You need the Manage Roles permission to manage role signups",
			"warn",
		);

	const query = state.queryParams;
	let pairs: { roleId: string; channelId: string }[];
	if (state.values) {
		pairs = state.values
			.map(pairOf)
			.filter((pair): pair is NonNullable<typeof pair> => pair !== null);
	} else {
		const roleId = query.get("role") ?? "";
		const channelId = query.get("channel");
		pairs = channelId
			? [{ roleId, channelId }]
			: (await sortedRoleSignups(guild)).filter(
					(mapping) => mapping.roleId === roleId,
				);
		if (pairs.length === 0)
			return flashRedirect(
				ROLES,
				`${mentionRole(roleId)} isn't signed up for any voice channel`,
				"warn",
			);
	}

	const removed: typeof pairs = [];
	const missing: typeof pairs = [];
	for (const pair of pairs) {
		if (await removeVoiceChatRole(pair.channelId, pair.roleId))
			removed.push(pair);
		else missing.push(pair);
	}

	const describe = (list: typeof pairs) =>
		joinWithAnd(
			list.map(
				({ roleId, channelId }) =>
					`${mentionRole(roleId)} from ${mentionChannel(channelId)}`,
			),
		);
	const parts = [
		...(removed.length > 0 ? [`Removed ${describe(removed)}`] : []),
		...(missing.length > 0 ? [`Already removed: ${describe(missing)}`] : []),
	];
	return flashRedirect(
		ROLES,
		parts.length > 0 ? parts.join(". ") : "No role signups to remove",
		removed.length > 0 ? "success" : "warn",
		{ page: query.get("page") ?? "0" },
	);
};
