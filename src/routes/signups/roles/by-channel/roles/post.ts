import { flashRedirect } from "@routes/lib/flash";
import { diffSelection, paginate } from "@routes/lib/paging";
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
	roleScopeOf,
	sortRoleIds,
} from "../../_shared";
import { canManageRoleSignups } from "../../../_shared";

// edits the roles signed up to one voice channel. Serves the panel's role
// multi-select (diffed against the shown page) and the /signuprole adapter
// (an `add` query param); the scope is the channel id in the path
export const rolesByChannelEditPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const guild = interaction.guild;
	if (!guild)
		return flashRedirect(
			BY_CHANNEL,
			"Signups only work inside a Discord server",
			"warn",
		);
	if (!canManageRoleSignups(interaction))
		return flashRedirect(
			BY_CHANNEL,
			"You need the Manage Roles permission to manage role signups",
			"warn",
		);

	const scope = roleScopeOf(state.params);
	if (!scope) return flashRedirect(BY_CHANNEL, "Pick a channel first", "warn");

	const query = state.queryParams;
	const current = sortRoleIds(
		guild,
		(await getVoiceChatSignups(scope)).roleIds,
	);

	let addsRequested: string[];
	let removesRequested: string[];
	if (state.values) {
		const { pageItems } = paginate(current, query.get("page"));
		({ added: addsRequested, removed: removesRequested } = diffSelection({
			allItems: current,
			pageItems,
			submitted: state.values,
		}));
	} else {
		addsRequested = query.getAll("add");
		removesRequested = query.getAll("remove");
	}

	return commitRoleEdit({
		redirect: `${BY_CHANNEL}/${scope}`,
		page: parseInt(query.get("page") ?? "0") || 0,
		current,
		addsRequested,
		removesRequested,
		mutateAdd: (roleId) => addVoiceChatRole(scope, roleId),
		mutateRemove: (roleId) => removeVoiceChatRole(scope, roleId),
		itemMention: mentionRole,
	});
};
