import { confirmModal } from "@routes/lib/confirm";
import { Handler } from "@routes/types";

import { PANEL } from "../_shared";

export const signupsResetModal: Handler<"MODAL"> = (router) =>
	confirmModal(router, {
		to: `${PANEL}/reset`,
		title: "Reset your signups",
		word: "RESET",
	});
