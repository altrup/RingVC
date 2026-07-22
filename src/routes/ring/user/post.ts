import { Handler } from "@routes/types";

import { ringUserIds } from "../_shared";

// the /ring user:@x quick path
export const ringUserPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const userId = state.queryParams.get("id");
	return ringUserIds(interaction, state.globals, userId ? [userId] : []);
};
