import { getVoiceChatRoleSignups, removeVoiceChatRole } from "@db/voice-chats";
import { mentionRole } from "@main/ring";
import { confirmed } from "@routes/lib/confirm";
import { flashRedirect } from "@routes/lib/flash";
import { Handler } from "@routes/types";

import { BY_ROLE, roleEditGuard } from "../../_shared";
import { guildVoiceChannelIds } from "../../../_shared";

// clears every voice channel one role is signed up for
export const rolesByRoleResetPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const guard = roleEditGuard(interaction, state.params, {
		base: BY_ROLE,
		noun: "role",
	});
	if (!("guild" in guard)) return guard;
	const { guild, scope } = guard;

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
