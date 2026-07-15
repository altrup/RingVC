import { RingRouter } from "@routes/types";
import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

export const help = {
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Getting started and the full command list"),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		await router.dispatch(interaction, "/help", {
			flags: [MessageFlags.Ephemeral],
		});
	},
};
