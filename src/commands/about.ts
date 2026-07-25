import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { RingRouter } from "@routes/types";

export const about = {
	data: new SlashCommandBuilder()
		.setName("about")
		.setDescription("Project links, policies, and feedback"),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		await router.dispatch(interaction, "/about", {
			flags: [MessageFlags.Ephemeral],
		});
	},
};
