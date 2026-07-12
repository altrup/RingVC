import { confirmed } from "@routes/lib/confirm";
import { flashRedirect } from "@routes/lib/flash";
import { channelIdOf, scopeOf } from "@routes/lib/scope";
import { Handler } from "@routes/types";

import { clearDefaultRingees } from "@db/default-ringees";

import { panelPath, scopeSuffix } from "../../_shared";

export const recipientsClearPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const scope = scopeOf(state.params);
	if (!confirmed(state.fields, "RESET"))
		return flashRedirect(
			panelPath(scope),
			"Confirmation text did not match, your recipients were not cleared",
			"warn",
		);
	const cleared = await clearDefaultRingees(
		interaction.user.id,
		channelIdOf(scope),
	);
	return cleared
		? flashRedirect(
				panelPath(scope),
				`Cleared your default ring recipients ${scopeSuffix(scope)}`,
				"success",
			)
		: flashRedirect(
				panelPath(scope),
				`You already have no default ring recipients ${scopeSuffix(scope)}`,
				"warn",
			);
};
