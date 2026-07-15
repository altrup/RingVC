import { resolveSelectionEdit } from "@routes/lib/paging";
import { Handler } from "@routes/types";

import {
	addVoiceChatRole,
	getVoiceChatSignups,
	removeVoiceChatRole,
} from "@db/voice-chats";
import { mentionRole } from "@main/ring";

import {
	BY_CHANNEL,
	commitRoleEdit,
	roleEditGuard,
	sortRoleIds,
} from "../../_shared";

// edits the roles signed up to one voice channel. Serves the panel's role
// multi-select (diffed against the shown page) and the /signuprole adapter
// (an `add` query param); the scope is the channel id in the path
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
	const current = sortRoleIds(guild, (await getVoiceChatSignups(scope)).roleIds);

	const { addsRequested, removesRequested, alreadyPresent } =
		resolveSelectionEdit({
			current,
			values: state.values,
			queryParams: query,
		});

	return commitRoleEdit({
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
	});
};
