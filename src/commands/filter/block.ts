import { RingRouter } from "@routes/types";
import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

export const block = {
	data: new SlashCommandBuilder()
		.setName("block")
		.setDescription("Blocks a user from ringing you, globally")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("Select a user to block")
				.setRequired(true),
		),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser("user", true);
		await router.dispatch(interaction, "/filter/global/members", {
			method: "POST",
			queryParams: { intent: "block", add: user.id },
			flags: [MessageFlags.Ephemeral],
		});
	},
};
