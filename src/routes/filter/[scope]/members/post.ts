import {
	addFilterEntry,
	filterType,
	getFilter,
	removeFilterEntry,
} from "@db/filters";
import { joinWithAnd, mentionUser } from "@main/ring";
import { flashRedirect } from "@routes/lib/flash";
import {
	paginate,
	resolveSelectionEdit,
	withPageLabel,
} from "@routes/lib/paging";
import { channelIdOf, scopeName, scopeOf } from "@routes/lib/scope";
import { Handler } from "@routes/types";

import { panelPath } from "../../_shared";

// one members editor serves the panel select and the /block, /unblock,
// /whitelist, /unwhitelist adapters; `intent` keys the guard that stops
// blocklist edits on a whitelist (and vice versa), keeping the rule in one place
export const filterMembersPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const scope = scopeOf(state.params);
	const channelId = channelIdOf(scope);
	const userId = interaction.user.id;
	const query = state.queryParams;
	const intent = query.get("intent") ?? "edit";
	const panel = panelPath(scope);

	const filter = await getFilter(userId, channelId);
	const type = filterType(filter);

	if (intent === "block" && type === "whitelist")
		return flashRedirect(
			panel,
			"Your global filter is a whitelist. Switch it to a blacklist below, or use /whitelist and /unwhitelist instead.",
			"warn",
		);
	if (intent === "whitelist" && type === "blacklist")
		return flashRedirect(
			panel,
			"Your global filter is a blacklist. Switch it to a whitelist below, or use /block and /unblock instead.",
			"warn",
		);

	const entries = [...(filter?.entries ?? [])].sort();
	const { addsRequested, removesRequested, alreadyPresent } =
		resolveSelectionEdit({
			current: entries,
			values: state.values,
			queryParams: query,
		});

	const entrySet = new Set(entries);
	const toAdd = addsRequested.filter((id) => !entrySet.has(id));
	const toRemove = removesRequested.filter((id) => entrySet.has(id));
	await Promise.all([
		...toAdd.map((id) => addFilterEntry(userId, channelId, id)),
		...toRemove.map((id) => removeFilterEntry(userId, channelId, id)),
	]);

	const changed = toAdd.length > 0 || toRemove.length > 0;
	// the post-edit list places every entry the flash mentions, so entries
	// that land or live off the rendered page get a page label
	const removeSet = new Set(toRemove);
	const after = [
		...entries.filter((id) => !removeSet.has(id)),
		...toAdd,
	].sort();
	const { page } = paginate(after, query.get("page"));
	const label = withPageLabel(after, mentionUser, page);

	const targetId = addsRequested[0] ?? removesRequested[0] ?? "";
	// mention with a page label when the target is in the list, plain when
	// the flash says it isn't
	const target = mentionUser(targetId);
	const listedTarget = label(targetId);
	let flash: string;
	if (intent === "block") {
		flash =
			addsRequested.length > 0
				? toAdd.length > 0
					? `Blocked ${listedTarget}`
					: `${listedTarget} is already blocked`
				: toRemove.length > 0
					? `Unblocked ${target}`
					: `${target} isn't blocked`;
	} else if (intent === "whitelist") {
		flash =
			addsRequested.length > 0
				? toAdd.length > 0
					? `Whitelisted ${listedTarget}`
					: `${listedTarget} is already whitelisted`
				: toRemove.length > 0
					? `Removed ${target} from your whitelist`
					: `${target} isn't on your whitelist`;
	} else {
		const parts = [
			...(toAdd.length > 0 ? [`Added ${joinWithAnd(toAdd.map(label))}`] : []),
			...(toRemove.length > 0
				? [`Removed ${joinWithAnd(toRemove.map(mentionUser))}`]
				: []),
			...(alreadyPresent.length > 0
				? [
						`${joinWithAnd(alreadyPresent.map(label))} ${alreadyPresent.length > 1 ? "are" : "is"} already listed`,
					]
				: []),
		];
		flash =
			parts.length > 0
				? `${parts.join(". ")} (${scopeName(scope, type)})`
				: `No changes to ${scopeName(scope, type)}`;
	}

	return flashRedirect(panel, flash, changed ? "success" : "warn", {
		page: query.get("page") ?? "0",
	});
};
