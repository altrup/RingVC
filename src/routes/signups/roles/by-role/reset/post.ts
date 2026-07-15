import { confirmed } from "@routes/lib/confirm";
import { flashRedirect } from "@routes/lib/flash";
import { Handler } from "@routes/types";

import { getVoiceChatRoleSignups, removeVoiceChatRole } from "@db/voice-chats";
import { mentionRole } from "@main/ring";

import { BY_ROLE, roleScopeOf } from "../../_shared";
import { canManageRoleSignups, guildVoiceChannelIds } from "../../../_shared";

// clears every voice channel one role is signed up for
export const rolesByRoleResetPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const guild = interaction.guild;
	if (!guild)
		return flashRedirect(
			BY_ROLE,
			"Signups only work inside a Discord server",
			"warn",
		);
	if (!canManageRoleSignups(interaction))
		return flashRedirect(
			BY_ROLE,
			"You need the Manage Roles permission to manage role signups",
			"warn",
		);
	const scope = roleScopeOf(state.params);
	if (!scope) return flashRedirect(BY_ROLE, "Pick a role first", "warn");

	const panel = `${BY_ROLE}/${scope}`;
	if (!confirmed(state.fields, "RESET"))
		return flashRedirect(
			panel,
			"Confirmation text did not match, the signups were not cleared",
			"warn",
		);

	const channelIds = (
		await getVoiceChatRoleSignups(guildVoiceChannelIds(guild))
	)
		.filter((mapping) => mapping.roleId === scope)
		.map((mapping) => mapping.channelId);
	if (channelIds.length === 0)
		return flashRedirect(
			panel,
			`${mentionRole(scope)} is not signed up for any voice channels`,
			"warn",
		);

	await Promise.all(
		channelIds.map((channelId) => removeVoiceChatRole(channelId, scope)),
	);
	return flashRedirect(
		panel,
		`Cleared the ${channelIds.length} voice channel${channelIds.length > 1 ? "s" : ""} ${mentionRole(scope)} was signed up for`,
		"success",
	);
};
