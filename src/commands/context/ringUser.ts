import {
	ApplicationCommandType,
	ContextMenuCommandBuilder,
	MessageFlags,
	UserContextMenuCommandInteraction,
} from "discord.js";

import { RingRouter } from "@routes/types";

export const ringUser = {
	data: new ContextMenuCommandBuilder()
		.setName("Ring")
		.setType(ApplicationCommandType.User),
	async execute(
		router: RingRouter,
		interaction: UserContextMenuCommandInteraction,
	) {
		await router.dispatch(interaction, "/ring/user", {
			method: "POST",
			queryParams: { id: interaction.targetUser.id },
			flags: [MessageFlags.Ephemeral],
		});
	},
};
