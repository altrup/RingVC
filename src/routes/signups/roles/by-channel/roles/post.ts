import {
	addVoiceChatRole,
	getVoiceChatSignups,
	removeVoiceChatRole,
} from "@db/voice-chats";
import { joinWithAnd, mentionChannel, mentionRole } from "@main/ring";
import { resolveSelectionEdit } from "@routes/lib/paging";
import { Handler } from "@routes/types";

import {
	BY_CHANNEL,
	commitRoleEdit,
	roleEditGuard,
	sortRoleIds,
} from "../../_shared";

// edits the roles signed up to one voice channel: the panel's role select
// (diffed against the page) and the /signuprole adapter's `add` query param
export const rolesByChannelEditPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const guard = roleEditGuard(interaction, state.params, {
		base: BY_CHANNEL,
		noun: "channel",
	});
	if (!("guild" in guard)) return guard;
	const { guild, scope } = guard;

	const query = state.queryParams;
	const current = sortRoleIds(
		guild,
		(await getVoiceChatSignups(scope)).roleIds,
	);

	const { addsRequested, removesRequested, alreadyPresent } =
		resolveSelectionEdit({
			current,
			values: state.values,
			queryParams: query,
		});

	return commitRoleEdit({
		interaction,
		redirect: `${BY_CHANNEL}/${scope}`,
		page: parseInt(query.get("page") ?? "0") || 0,
		current,
		addsRequested,
		removesRequested,
		alreadyPresent,
		mutateAdd: (roleId) => addVoiceChatRole(scope, roleId),
		mutateRemove: (roleId) => removeVoiceChatRole(scope, roleId),
		itemMention: mentionRole,
		sortItems: (roleIds) => sortRoleIds(guild, roleIds),
		alreadySignedUp: (roleIds) =>
			`${joinWithAnd(roleIds.map(mentionRole))} ${roleIds.length > 1 ? "are" : "is"} already signed up for ${mentionChannel(scope)}`,
		notSignedUp: (roleIds) =>
			`${joinWithAnd(roleIds.map(mentionRole))} ${roleIds.length > 1 ? "aren't" : "isn't"} signed up for ${mentionChannel(scope)}`,
	});
};
