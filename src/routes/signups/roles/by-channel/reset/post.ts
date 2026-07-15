import { confirmed } from "@routes/lib/confirm";
import { flashRedirect } from "@routes/lib/flash";
import { Handler } from "@routes/types";

import { getVoiceChatSignups, removeVoiceChatRole } from "@db/voice-chats";

import { BY_CHANNEL, roleScopeOf } from "../../_shared";
import { canManageRoleSignups, mentionChannel } from "../../../_shared";

// clears every role pinged in one voice channel
export const rolesByChannelResetPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	if (!interaction.guild)
		return flashRedirect(
			BY_CHANNEL,
			"Signups only work inside a Discord server",
			"warn",
		);
	if (!canManageRoleSignups(interaction))
		return flashRedirect(
			BY_CHANNEL,
			"You need the Manage Roles permission to manage role signups",
			"warn",
		);
	const scope = roleScopeOf(state.params);
	if (!scope) return flashRedirect(BY_CHANNEL, "Pick a channel first", "warn");

	const panel = `${BY_CHANNEL}/${scope}`;
	if (!confirmed(state.fields, "RESET"))
		return flashRedirect(
			panel,
			"Confirmation text did not match, the roles were not cleared",
			"warn",
		);

	const { roleIds } = await getVoiceChatSignups(scope);
	if (roleIds.length === 0)
		return flashRedirect(
			panel,
			`${mentionChannel(scope)} has no roles signed up`,
			"warn",
		);

	await Promise.all(
		roleIds.map((roleId) => removeVoiceChatRole(scope, roleId)),
	);
	return flashRedirect(
		panel,
		`Cleared the ${roleIds.length} role${roleIds.length > 1 ? "s" : ""} pinged in ${mentionChannel(scope)}`,
		"success",
	);
};
