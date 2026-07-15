import { flashRedirect } from "@routes/lib/flash";
import { diffSelection, paginate } from "@routes/lib/paging";
import { Handler } from "@routes/types";

import {
	addVoiceChatRole,
	getVoiceChatRoleSignups,
	removeVoiceChatRole,
} from "@db/voice-chats";

import {
	BY_ROLE,
	commitRoleEdit,
	roleScopeOf,
	sortChannelIds,
} from "../../_shared";
import {
	canManageRoleSignups,
	guildVoiceChannelIds,
	mentionChannel,
} from "../../../_shared";

// edits the channels one role is signed up to. Serves the panel's channel
// multi-select (diffed against the shown page) and the /unsignuprole adapter
// (a `remove` query param, or `removeAll` to clear every channel); the scope
// is the role id in the path
export const rolesByRoleEditPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const guild = interaction.guild;
	if (!guild)
		return flashRedirect(
			BY_ROLE,
			"Signups only work inside a Discord server",
			"warn",
		);
	if (!canManageRoleSignups(interaction))
		return flashRedirect(
			BY_ROLE,
			"You need the Manage Roles permission to manage role signups",
			"warn",
		);

	const scope = roleScopeOf(state.params);
	if (!scope) return flashRedirect(BY_ROLE, "Pick a role first", "warn");

	const query = state.queryParams;
	const current = sortChannelIds(
		guild,
		(await getVoiceChatRoleSignups(guildVoiceChannelIds(guild)))
			.filter((mapping) => mapping.roleId === scope)
			.map((mapping) => mapping.channelId),
	);

	let addsRequested: string[];
	let removesRequested: string[];
	let alreadyPresent: string[] = [];
	if (state.values) {
		const { pageItems } = paginate(current, query.get("page"));
		({
			added: addsRequested,
			removed: removesRequested,
			alreadyPresent,
		} = diffSelection({
			allItems: current,
			pageItems,
			submitted: state.values,
		}));
	} else if (query.get("removeAll")) {
		addsRequested = [];
		removesRequested = current;
	} else {
		addsRequested = query.getAll("add");
		removesRequested = query.getAll("remove");
	}

	return commitRoleEdit({
		redirect: `${BY_ROLE}/${scope}`,
		page: parseInt(query.get("page") ?? "0") || 0,
		current,
		addsRequested,
		removesRequested,
		alreadyPresent,
		mutateAdd: (channelId) => addVoiceChatRole(channelId, scope),
		mutateRemove: (channelId) => removeVoiceChatRole(channelId, scope),
		itemMention: mentionChannel,
	});
};
