import { getErrorMessage, ringDefaultUsers } from "@main/ring";
import { flashRedirect } from "@routes/lib/flash";
import { commandMention } from "@routes/lib/mentions";
import { Handler } from "@routes/types";

import {
	noVoiceChannelFlash,
	PANEL,
	ringResultsFlash,
	voiceChannelOf,
} from "../_shared";

export const ringDefaultPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const channel = voiceChannelOf(interaction);
	if (!channel)
		return flashRedirect(
			interaction,
			PANEL,
			noVoiceChannelFlash(interaction),
			"warn",
		);

	try {
		const results = await ringDefaultUsers(
			channel,
			interaction.user.id,
			"wants you to join",
		);
		const { flash, level } = ringResultsFlash(results);
		return flashRedirect(interaction, PANEL, flash, level);
	} catch (err) {
		const message = getErrorMessage(err);
		return message === "no default users to ring"
			? // from a slash command the notice's button leads to the default-ringees
				// panel, where the missing recipients get added
				flashRedirect(
					interaction,
					interaction.isChatInputCommand() ? "/recipients/global" : PANEL,
					`You have no default ring recipients. Use the Ring recipients panel on the home page or ${commandMention(state.globals, "default_ring_recipients")} to add some`,
					"warn",
				)
			: flashRedirect(
					interaction,
					PANEL,
					`Can't ring your default recipients because ${message}`,
					"warn",
				);
	}
};
