import { flashRedirect } from "@routes/lib/flash";
import { channelIdOf, scopeOf } from "@routes/lib/scope";
import { Handler } from "@routes/types";

import { unsetAutoRing } from "@db/auto-ring";

import { panelPath } from "../../../_shared";

export const recipientsAutoRingUnsetPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const scope = scopeOf(state.params);
	const channelId = channelIdOf(scope);
	const panel = panelPath(scope);
	if (channelId === null)
		return flashRedirect(
			panel,
			"Only channel scopes have an auto-ring override to remove",
			"warn",
		);

	const existed = await unsetAutoRing(interaction.user.id, channelId);
	return existed
		? flashRedirect(
				panel,
				`Removed the auto-ring override for <#${channelId}>; your global setting applies again`,
				"success",
			)
		: flashRedirect(
				panel,
				`You have no auto-ring override for <#${channelId}>`,
				"warn",
			);
};
