import { flashRedirect } from "@routes/lib/flash";
import { resolveSelectionEdit } from "@routes/lib/paging";
import { channelIdOf, scopeOf } from "@routes/lib/scope";
import { Handler } from "@routes/types";

import {
	addDefaultRingee,
	getDefaultRingees,
	removeDefaultRingee,
} from "@db/default-ringees";
import { joinWithAnd, mentionUser } from "@main/ring";

import { panelPath, scopeSuffix } from "../../_shared";

export const recipientsMembersPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const scope = scopeOf(state.params);
	const channelId = channelIdOf(scope);
	const userId = interaction.user.id;
	const panel = panelPath(scope);

	const ringees = [...(await getDefaultRingees(userId, channelId))].sort();
	const { addsRequested, removesRequested } = resolveSelectionEdit({
		current: ringees,
		values: state.values,
		queryParams: state.queryParams,
	});
	const ringeeSet = new Set(ringees);
	const added = addsRequested.filter((id) => !ringeeSet.has(id));
	const removed = removesRequested.filter((id) => ringeeSet.has(id));

	await Promise.all([
		...added.map((id) => addDefaultRingee(userId, channelId, id)),
		...removed.map((id) => removeDefaultRingee(userId, channelId, id)),
	]);

	const parts = [
		...(added.length > 0
			? [`Added ${joinWithAnd(added.map(mentionUser))}`]
			: []),
		...(removed.length > 0
			? [`Removed ${joinWithAnd(removed.map(mentionUser))}`]
			: []),
	];
	const changed = parts.length > 0;
	return flashRedirect(
		panel,
		changed
			? `${parts.join(". ")} (default ring recipients ${scopeSuffix(scope)})`
			: `No changes to your default ring recipients ${scopeSuffix(scope)}`,
		changed ? "success" : "warn",
		{ page: state.queryParams.get("page") ?? "0" },
	);
};
