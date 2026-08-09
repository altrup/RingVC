import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { RingRouter } from "@routes/types";

export const ring = {
	data: new SlashCommandBuilder()
		.setName("ring")
		.setDescription("Ring people into your voice channel")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("Ring this user right away (leave blank for the panel)")
				.setRequired(false),
		),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser("user");
		if (user) {
			await router.dispatch(interaction, "/ring/user", {
				method: "POST",
				queryParams: { id: user.id },
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}
		await router.dispatch(interaction, "/ring", {
			flags: [MessageFlags.Ephemeral],
		});
	},
};
