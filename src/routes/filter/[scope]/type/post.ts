import { filterType, getFilter, setFilterType } from "@db/filters";
import { flashRedirect } from "@routes/lib/flash";
import { channelIdOf, scopeName, scopeOf } from "@routes/lib/scope";
import { Handler } from "@routes/types";

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

	// the entries carry over and the switch reverses what they mean, so the
	// notice has to say so: a blacklist's blocked users become the only people
	// a whitelist lets through, and vice versa
	const lead = `${scopeName(scope, "filter", { capitalize: true })} is now a ${to}`;
	if ((filter?.entries.size ?? 0) === 0)
		return flashRedirect(panel, lead, "success");

	return flashRedirect(
		panel,
		to === "whitelist"
			? `${lead}. The people on it were blocked, and are now the only people who can ring you`
			: `${lead}. The people on it were the only people who could ring you, and are now blocked`,
		"warn",
	);
};
