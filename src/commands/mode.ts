import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { RingRouter } from "@routes/types";

export const mode = {
	data: new SlashCommandBuilder()
		.setName("mode")
		.setDescription("View and change what happens when you join a voice channel"),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		await router.dispatch(interaction, "/mode", {
			flags: [MessageFlags.Ephemeral],
		});
	},
};
