import { flashRedirect } from "@routes/lib/flash";
import { diffSelection, paginate } from "@routes/lib/paging";
import { Handler } from "@routes/types";

import { addVoiceChatUser, removeVoiceChatUser } from "@db/voice-chats";
import { joinWithAnd } from "@main/ring";

import { guildSignups, mentionChannel, PANEL } from "../_shared";

// serves the panel's diff select and the /signup, /unsignup and /quit
// adapters (which pass add/remove channel ids as query params)
export const signupsMembersPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const guild = interaction.guild;
	if (!guild)
		return flashRedirect(
			PANEL,
			"Signups only work inside a Discord server",
			"warn",
		);

	const userId = interaction.user.id;
	const query = state.queryParams;
	let addsRequested: string[];
	let removesRequested: string[];
	if (state.values) {
		const signups = await guildSignups(userId, guild);
		const { pageItems } = paginate(signups, query.get("page"));
		({ added: addsRequested, removed: removesRequested } = diffSelection({
			allItems: signups,
			pageItems,
			submitted: state.values,
		}));
	} else {
		addsRequested = query.getAll("add");
		removesRequested = query.getAll("remove");
	}

	const added: string[] = [];
	const alreadySignedUp: string[] = [];
	for (const channelId of addsRequested) {
		if (await addVoiceChatUser(channelId, userId)) added.push(channelId);
		else alreadySignedUp.push(channelId);
	}
	const removed: string[] = [];
	const notSignedUp: string[] = [];
	for (const channelId of removesRequested) {
		if (await removeVoiceChatUser(channelId, userId)) removed.push(channelId);
		else notSignedUp.push(channelId);
	}

	const parts = [
		...(added.length > 0
			? [`Signed up for ${joinWithAnd(added.map(mentionChannel))}`]
			: []),
		...(alreadySignedUp.length > 0
			? [
					`You are already signed up for ${joinWithAnd(alreadySignedUp.map(mentionChannel))}`,
				]
			: []),
		...(removed.length > 0
			? [
					`You will no longer be rung for ${joinWithAnd(removed.map(mentionChannel))}`,
				]
			: []),
		...(notSignedUp.length > 0
			? [
					`You aren't signed up for ${joinWithAnd(notSignedUp.map(mentionChannel))}`,
				]
			: []),
	];
	const changed = added.length > 0 || removed.length > 0;
	return flashRedirect(
		PANEL,
		parts.length > 0 ? parts.join(". ") : "No changes to your signups",
		changed ? "success" : "warn",
		{ page: query.get("page") ?? "0" },
	);
};
