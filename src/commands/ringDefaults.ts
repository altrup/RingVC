import { RingRouter } from "@routes/types";
import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

export const ringDefaults = {
	data: new SlashCommandBuilder()
		.setName("ring_defaults")
		.setDescription("Ring your default recipients into your voice channel"),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		await router.dispatch(interaction, "/ring/default", {
			method: "POST",
			flags: [MessageFlags.Ephemeral],
		});
	},
};
