import { deleteAllUserData } from "@db/users";
import { confirmed } from "@routes/lib/confirm";
import { flashRedirect } from "@routes/lib/flash";
import { Handler } from "@routes/types";

import { CONFIRMATION, PANEL } from "./_shared";

export const deleteDataPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	if (!confirmed(state.fields, CONFIRMATION))
		return flashRedirect(
			PANEL,
			"Confirmation text did not match, nothing was deleted",
			"warn",
		);

	const hadData = await deleteAllUserData(interaction.user.id);
	return flashRedirect(
		PANEL,
		hadData
			? "All your data has been deleted"
			: "You had no stored data to delete",
		hadData ? "success" : "warn",
		{ done: "1" },
	);
};
