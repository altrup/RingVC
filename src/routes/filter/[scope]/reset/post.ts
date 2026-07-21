import { resetFilter } from "@db/filters";
import { confirmed } from "@routes/lib/confirm";
import { flashRedirect } from "@routes/lib/flash";
import { channelIdOf, scopeName, scopeOf } from "@routes/lib/scope";
import { Handler } from "@routes/types";

import { panelPath } from "../../_shared";

export const filterResetPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const scope = scopeOf(state.params);
	const panel = panelPath(scope);
	if (!confirmed(state.fields, "RESET"))
		return flashRedirect(
			interaction,
			panel,
			"Confirmation text did not match, the filter was not reset",
			"warn",
		);
	const wasNotDefault = await resetFilter(
		interaction.user.id,
		channelIdOf(scope),
	);
	return wasNotDefault
		? flashRedirect(
				interaction,
				panel,
				`${scopeName(scope, "filter", { capitalize: true })} has been reset and is an empty blacklist`,
				"success",
			)
		: flashRedirect(
				interaction,
				panel,
				`${scopeName(scope, "filter", { capitalize: true })} is already the default (an empty blacklist)`,
				"warn",
			);
};
