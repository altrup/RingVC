import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { RingRouter } from "@routes/types";

export const unwhitelist = {
	data: new SlashCommandBuilder()
		.setName("unwhitelist")
		.setDescription("Removes a user from your global whitelist")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("Select a user to unwhitelist")
				.setRequired(true),
		),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser("user", true);
		await router.dispatch(interaction, "/filter/global/members", {
			method: "POST",
			queryParams: { intent: "whitelist", remove: user.id },
			flags: [MessageFlags.Ephemeral],
		});
	},
};
