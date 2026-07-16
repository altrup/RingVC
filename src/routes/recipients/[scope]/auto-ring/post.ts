import { setAutoRing } from "@db/auto-ring";
import { flashRedirect } from "@routes/lib/flash";
import { channelIdOf, scopeOf } from "@routes/lib/scope";
import { Handler } from "@routes/types";

import { panelPath, scopeSuffix } from "../../_shared";

export const recipientsAutoRingPost: Handler<"POST"> = async (
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
			panel,
			`Auto-ring is already ${enable ? "enabled" : "disabled"} ${scopeSuffix(scope)}`,
			"warn",
		);
	return enable
		? flashRedirect(
				panel,
				`Auto-ring is now enabled ${scopeSuffix(scope)}. WARNING: joining ${channelId ? `<#${channelId}>` : "a voice channel"} now rings all of your default ring recipients, even in stealth mode`,
				"warn",
			)
		: flashRedirect(
				panel,
				`Auto-ring is now disabled ${scopeSuffix(scope)}`,
				"success",
			);
};
