import { Handler } from "@routes/types";

import { ringUserIds } from "../_shared";

export const ringUsersPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => ringUserIds(interaction, state.globals, state.values ?? []);
