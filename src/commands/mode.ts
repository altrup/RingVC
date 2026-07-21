import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { MODES, PATH } from "@routes/mode/_shared";
import { RingRouter } from "@routes/types";

export const mode = {
	data: new SlashCommandBuilder()
		.setName("mode")
		.setDescription(
			"View and change what happens when you join a voice channel",
		)
		.addStringOption((option) =>
			option
				.setName("mode")
				.setDescription("Switch to this mode directly")
				.addChoices(
					...MODES.map(({ mode, label }) => ({ name: label, value: mode })),
				)
				.setRequired(false),
		),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		const target = interaction.options.getString("mode");
		// without a mode, open the panel to pick one
		await router.dispatch(interaction, PATH, {
			...(target === null
				? {}
				: { method: "POST" as const, queryParams: { set: target } }),
			flags: [MessageFlags.Ephemeral],
		});
	},
};
