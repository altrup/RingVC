import { flashRedirect } from "@routes/lib/flash";
import { Handler } from "@routes/types";

import { addVoiceChatRole } from "@db/voice-chats";
import { mentionRole } from "@main/ring";

import { canManageRoleSignups, mentionChannel, ROLES } from "../../_shared";

export const signupsRolePost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	if (!canManageRoleSignups(interaction))
		return flashRedirect(
			ROLES,
			"You need the Manage Roles permission to manage role signups",
			"warn",
		);

	const roleId =
		typeof state.params.roleId === "string" ? state.params.roleId : "";
	const channelId = state.queryParams.get("channel") ?? "";
	const channel = interaction.guild?.channels.cache.get(channelId);
	if (!channel?.isVoiceBased())
		return flashRedirect(
			`${ROLES}/${roleId}`,
			"Pick a voice channel to finish the role signup",
			"warn",
		);

	const added = await addVoiceChatRole(channelId, roleId);
	return added
		? flashRedirect(
				ROLES,
				`Signed up ${mentionRole(roleId)} for ${mentionChannel(channelId)}`,
				"success",
			)
		: flashRedirect(
				ROLES,
				`${mentionRole(roleId)} is already signed up for ${mentionChannel(channelId)}`,
				"warn",
			);
};
