import {
	addVoiceChatRole,
	getVoiceChatRoleSignups,
	removeVoiceChatRole,
} from "@db/voice-chats";
import { joinWithAnd, mentionChannel, mentionRole } from "@main/ring";
import { resolveSelectionEdit } from "@routes/lib/paging";
import { Handler } from "@routes/types";

import {
	BY_ROLE,
	commitRoleEdit,
	roleEditGuard,
	sortChannelIds,
} from "../../_shared";
import { guildVoiceChannelIds } from "../../../_shared";

// edits the channels one role is signed up to: the panel's channel select
// (diffed against the page) and the /unsignuprole adapter's `remove` query param
export const rolesByRoleEditPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const guard = roleEditGuard(interaction, state.params, {
		base: BY_ROLE,
		noun: "role",
	});
	if (!("guild" in guard)) return guard;
	const { guild, scope } = guard;

	const query = state.queryParams;
	const current = sortChannelIds(
		guild,
		(await getVoiceChatRoleSignups(guildVoiceChannelIds(guild)))
			.filter((mapping) => mapping.roleId === scope)
			.map((mapping) => mapping.channelId),
	);

	const { addsRequested, removesRequested, alreadyPresent } =
		resolveSelectionEdit({
			current,
			values: state.values,
			queryParams: query,
		});

	return commitRoleEdit({
		interaction,
		redirect: `${BY_ROLE}/${scope}`,
		page: parseInt(query.get("page") ?? "0") || 0,
		current,
		addsRequested,
		removesRequested,
		alreadyPresent,
		mutateAdd: (channelId) => addVoiceChatRole(channelId, scope),
		mutateRemove: (channelId) => removeVoiceChatRole(channelId, scope),
		itemMention: mentionChannel,
		sortItems: (channelIds) => sortChannelIds(guild, channelIds),
		alreadySignedUp: (channelIds) =>
			`${mentionRole(scope)} is already signed up for ${joinWithAnd(channelIds.map(mentionChannel))}`,
		notSignedUp: (channelIds) =>
			`${mentionRole(scope)} isn't signed up for ${joinWithAnd(channelIds.map(mentionChannel))}`,
	});
};
