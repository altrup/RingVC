import { confirmModal } from "@routes/lib/confirm";
import { Handler } from "@routes/types";

import { BY_CHANNEL, roleScopeOf } from "../../_shared";

export const rolesByChannelResetModal: Handler<"MODAL"> = (
	router,
	interaction,
	state,
) =>
	confirmModal(router, {
		to: `${BY_CHANNEL}/${roleScopeOf(state.params) ?? ""}/reset`,
		title: "Reset this channel's roles",
		word: "RESET",
	});
