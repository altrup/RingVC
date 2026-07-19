import { getErrorMessage, ringDefaultUsers } from "@main/ring";
import { flashRedirect } from "@routes/lib/flash";
import { commandMention } from "@routes/lib/mentions";
import { Handler } from "@routes/types";

import { noVoiceChannelFlash, ringResultsFlash, voiceChannelOf } from "../_shared";

// the Ring defaults button lives on the Default ringees panel, so results and
// warnings redirect back to that panel
const DEFAULT_RINGEES_PANEL = "/recipients/global";

export const ringDefaultPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const channel = voiceChannelOf(interaction);
	if (!channel)
		return flashRedirect(
			DEFAULT_RINGEES_PANEL,
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
		return flashRedirect(DEFAULT_RINGEES_PANEL, flash, level);
	} catch (err) {
		const message = getErrorMessage(err);
		return message === "no default users to ring"
			? flashRedirect(
					DEFAULT_RINGEES_PANEL,
					`You have no default ring recipients. Use the Ring recipients panel on the home page or ${commandMention(state.globals, "default_ring_recipients")} to add some`,
					"warn",
				)
			: flashRedirect(
					DEFAULT_RINGEES_PANEL,
					`Can't ring your default recipients because ${message}`,
					"warn",
				);
	}
};
