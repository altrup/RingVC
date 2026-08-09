import { setAutoRing } from "@db/auto-ring";
import { flashIcon, flashRedirect } from "@routes/lib/flash";
import { channelIdOf, scopeOf } from "@routes/lib/scope";
import { Handler } from "@routes/types";

import { panelPath, scopeSuffix } from "../../_shared";

export const ringeesAutoRingPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const scope = scopeOf(state.params);
	const channelId = channelIdOf(scope);
	const enable = state.queryParams.get("enable") === "1";
	const panel = panelPath(scope);

	const changed = await setAutoRing(interaction.user.id, channelId, enable);
	if (!changed)
		return flashRedirect(
			interaction,
			panel,
			`Auto-ring is already ${enable ? "enabled" : "disabled"} ${scopeSuffix(scope)}`,
			"warn",
		);
	return enable
		? flashRedirect(
				interaction,
				panel,
				// the toggle worked; the consequence is a note about what was just
				// asked for, so it gets its own marked line rather than shouting
				// inside the success sentence
				`${flashIcon("success")} Auto-ring is now enabled ${scopeSuffix(scope)}\n` +
					`${flashIcon("info")} Joining ${channelId ? `<#${channelId}>` : "a voice channel"} now rings all of your default ringees, even in stealth mode`,
				"success",
			)
		: flashRedirect(
				interaction,
				panel,
				`Auto-ring is now disabled ${scopeSuffix(scope)}`,
				"success",
			);
};
