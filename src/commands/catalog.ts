import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { RingRouter } from "@routes/types";

export const catalog = {
	data: new SlashCommandBuilder()
		.setName("catalog")
		.setDescription("List every RingVC command"),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		await router.dispatch(interaction, "/help/catalog", {
			flags: [MessageFlags.Ephemeral],
		});
	},
};
