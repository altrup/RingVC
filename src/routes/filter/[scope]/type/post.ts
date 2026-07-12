import { flashRedirect } from "@routes/lib/flash";
import { channelIdOf, scopeName, scopeOf } from "@routes/lib/scope";
import { Handler } from "@routes/types";

import { filterType, getFilter, setFilterType } from "@db/filters";

import { panelPath } from "../../_shared";

export const filterTypePost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const scope = scopeOf(state.params);
	const channelId = channelIdOf(scope);
	const panel = panelPath(scope);
	const to =
		state.queryParams.get("to") === "whitelist" ? "whitelist" : "blacklist";

	const filter = await getFilter(interaction.user.id, channelId);
	if (filterType(filter) === to)
		return flashRedirect(
			panel,
			`${scopeName(scope, "filter", { capitalize: true })} is already a ${to}`,
			"warn",
		);

	await setFilterType(interaction.user.id, channelId, to === "whitelist");
	return flashRedirect(
		panel,
		`${scopeName(scope, "filter", { capitalize: true })} was reset and changed to a ${to}`,
		"warn",
	);
};
