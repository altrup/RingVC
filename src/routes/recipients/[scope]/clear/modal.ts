import { confirmModal } from "@routes/lib/confirm";
import { scopeOf } from "@routes/lib/scope";
import { Handler } from "@routes/types";

import { panelPath } from "../../_shared";

export const recipientsClearModal: Handler<"MODAL"> = (
	router,
	interaction,
	state,
) =>
	confirmModal(router, {
		to: `${panelPath(scopeOf(state.params))}/clear`,
		title: "Reset ring recipients",
		word: "RESET",
	});
