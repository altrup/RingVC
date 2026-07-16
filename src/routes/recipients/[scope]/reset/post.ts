import { resetDefaultRingees } from "@db/default-ringees";
import { confirmed } from "@routes/lib/confirm";
import { flashRedirect } from "@routes/lib/flash";
import { channelIdOf, scopeOf } from "@routes/lib/scope";
import { Handler } from "@routes/types";

import { panelPath, scopeSuffix } from "../../_shared";

export const recipientsResetPost: Handler<"POST"> = async (
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
	const hadRingees = await resetDefaultRingees(
		interaction.user.id,
		channelIdOf(scope),
	);
	return hadRingees
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
