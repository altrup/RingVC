import { flashRedirect } from "@routes/lib/flash";
import { resolveSelectionEdit } from "@routes/lib/paging";
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
	// only the select path needs the current signups to diff against; command
	// adapters pass the ids to add/remove directly, so skip the fetch for them
	const signups = state.values ? await guildSignups(userId, guild) : [];
	const { addsRequested, removesRequested } = resolveSelectionEdit({
		current: signups,
		values: state.values,
		queryParams: query,
	});

	const addResults = await Promise.all(
		addsRequested.map(async (channelId) => ({
			channelId,
			ok: await addVoiceChatUser(channelId, userId),
		})),
	);
	const added = addResults.filter((r) => r.ok).map((r) => r.channelId);
	const alreadySignedUp = addResults
		.filter((r) => !r.ok)
		.map((r) => r.channelId);

	const removeResults = await Promise.all(
		removesRequested.map(async (channelId) => ({
			channelId,
			ok: await removeVoiceChatUser(channelId, userId),
		})),
	);
	const removed = removeResults.filter((r) => r.ok).map((r) => r.channelId);
	const notSignedUp = removeResults
		.filter((r) => !r.ok)
		.map((r) => r.channelId);

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
