import { confirmed } from "@routes/lib/confirm";
import { flashRedirect } from "@routes/lib/flash";
import { channelIdOf, scopeName, scopeOf } from "@routes/lib/scope";
import { Handler } from "@routes/types";

import { resetFilter } from "@db/filters";

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
				panel,
				`${scopeName(scope, "filter", { capitalize: true })} has been reset and is an empty blacklist`,
				"success",
			)
		: flashRedirect(
				panel,
				`${scopeName(scope, "filter", { capitalize: true })} is already the default (an empty blacklist)`,
				"warn",
			);
};
