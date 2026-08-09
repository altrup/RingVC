import { getErrorMessage, ringDefaultUsers } from "@main/ring";
import { flashRedirect } from "@routes/lib/flash";
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
			noVoiceChannelFlash(interaction, state.globals),
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
			? // from a command the notice's button leads to the default-ringees
				// panel, where the missing ringees get added
				flashRedirect(
					interaction,
					interaction.isCommand() ? "/ringees/global" : PANEL,
					`You have no default ringees. Add some in the Default ringees panel`,
					"warn",
				)
			: flashRedirect(
					interaction,
					PANEL,
					`Can't ring your default ringees because ${message}`,
					"warn",
				);
	}
};
