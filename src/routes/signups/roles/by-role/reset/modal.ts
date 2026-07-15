import { confirmModal } from "@routes/lib/confirm";
import { Handler } from "@routes/types";

import { BY_ROLE, roleScopeOf } from "../../_shared";

export const rolesByRoleResetModal: Handler<"MODAL"> = (
	router,
	interaction,
	state,
) =>
	confirmModal(router, {
		to: `${BY_ROLE}/${roleScopeOf(state.params) ?? ""}/reset`,
		title: "Reset this role's signups",
		word: "RESET",
	});
