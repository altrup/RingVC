import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { RingRouter } from "@routes/types";

export const help = {
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Getting started"),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		await router.dispatch(interaction, "/", {
			flags: [MessageFlags.Ephemeral],
		});
	},
};
