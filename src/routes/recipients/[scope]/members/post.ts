import { flashRedirect } from "@routes/lib/flash";
import {
	paginate,
	resolveSelectionEdit,
	withPageLabel,
} from "@routes/lib/paging";
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
	const { addsRequested, removesRequested, alreadyPresent } =
		resolveSelectionEdit({
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

	// the post-edit list places every entry the flash mentions, so entries
	// that land or live off the rendered page get a page label
	const removedSet = new Set(removed);
	const after = [
		...ringees.filter((id) => !removedSet.has(id)),
		...added,
	].sort();
	const { page } = paginate(after, state.queryParams.get("page"));
	const label = withPageLabel(after, mentionUser, page);

	const parts = [
		...(added.length > 0 ? [`Added ${joinWithAnd(added.map(label))}`] : []),
		...(removed.length > 0
			? [`Removed ${joinWithAnd(removed.map(mentionUser))}`]
			: []),
		...(alreadyPresent.length > 0
			? [
					`${joinWithAnd(alreadyPresent.map(label))} ${alreadyPresent.length > 1 ? "are" : "is"} already added`,
				]
			: []),
	];
	const changed = added.length > 0 || removed.length > 0;
	return flashRedirect(
		panel,
		parts.length > 0
			? `${parts.join(". ")} (default ring recipients ${scopeSuffix(scope)})`
			: `No changes to your default ring recipients ${scopeSuffix(scope)}`,
		changed ? "success" : "warn",
		{ page: state.queryParams.get("page") ?? "0" },
	);
};
