import { confirmModal } from "@routes/lib/confirm";
import { scopeOf } from "@routes/lib/scope";
import { Handler } from "@routes/types";

import { panelPath } from "../../_shared";

export const recipientsResetModal: Handler<"MODAL"> = (
	router,
	interaction,
	state,
) =>
	confirmModal(router, {
		to: `${panelPath(scopeOf(state.params))}/reset`,
		title: "Reset ring recipients",
		word: "RESET",
	});
