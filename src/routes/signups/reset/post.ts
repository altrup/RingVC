import { confirmed } from "@routes/lib/confirm";
import { flashRedirect } from "@routes/lib/flash";
import { Handler } from "@routes/types";

import { removeVoiceChatUser } from "@db/voice-chats";

import { guildSignups, PANEL } from "../_shared";

// clears the caller's signups in this guild only; other guilds keep theirs
export const signupsResetPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const guild = interaction.guild;
	if (!guild)
		return flashRedirect(
			PANEL,
			"Signups only work inside a Discord server",
			"warn",
		);
	if (!confirmed(state.fields, "RESET"))
		return flashRedirect(
			PANEL,
			"Confirmation text did not match, your signups were not cleared",
			"warn",
		);

	const userId = interaction.user.id;
	const signups = await guildSignups(userId, guild);
	if (signups.length === 0)
		return flashRedirect(PANEL, "You have no signups in this server", "warn");

	await Promise.all(
		signups.map((channelId) => removeVoiceChatUser(channelId, userId)),
	);
	return flashRedirect(
		PANEL,
		`Cleared your ${signups.length} signup${signups.length > 1 ? "s" : ""} in this server`,
		"success",
	);
};
