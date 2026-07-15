import { confirmed } from "@routes/lib/confirm";
import { flashRedirect } from "@routes/lib/flash";
import { Handler } from "@routes/types";

import { getVoiceChatSignups, removeVoiceChatRole } from "@db/voice-chats";
import { mentionChannel } from "@main/ring";

import { BY_CHANNEL, roleEditGuard } from "../../_shared";

// clears every role pinged in one voice channel
export const rolesByChannelResetPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const guard = roleEditGuard(interaction, state.params, {
		base: BY_CHANNEL,
		noun: "channel",
	});
	if (!("guild" in guard)) return guard;
	const { scope } = guard;

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
