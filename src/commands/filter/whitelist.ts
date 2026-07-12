import { RingRouter } from "@routes/types";
import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

export const whitelist = {
	data: new SlashCommandBuilder()
		.setName("whitelist")
		.setDescription("Adds a user to your global whitelist")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("Select a user to whitelist")
				.setRequired(true),
		),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser("user", true);
		await router.dispatch(interaction, "/filter/global/members", {
			method: "POST",
			queryParams: { intent: "whitelist", add: user.id },
			flags: [MessageFlags.Ephemeral],
		});
	},
};
