import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { RingRouter } from "@routes/types";

export const ringvc = {
	data: new SlashCommandBuilder()
		.setName("ringvc")
		.setDescription("Open the RingVC home panel"),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		await router.dispatch(interaction, "/", {
			flags: [MessageFlags.Ephemeral],
		});
	},
};
