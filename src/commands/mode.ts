import { RingRouter } from "@routes/types";
import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

export const mode = {
	data: new SlashCommandBuilder()
		.setName("mode")
		.setDescription(
			"View and change what happens when you join a voice channel",
		),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		await router.dispatch(interaction, "/mode", {
			flags: [MessageFlags.Ephemeral],
		});
	},
};
