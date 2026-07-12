import { confirmModal } from "@routes/lib/confirm";
import { Handler } from "@routes/types";

import { CONFIRMATION, PANEL } from "../_shared";

export const deleteDataConfirmModal: Handler<"MODAL"> = (router) =>
	confirmModal(router, {
		to: PANEL,
		title: "Delete all data",
		word: CONFIRMATION,
	});
