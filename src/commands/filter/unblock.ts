import { RingRouter } from "@routes/types";
import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

export const unblock = {
	data: new SlashCommandBuilder()
		.setName("unblock")
		.setDescription("Unblocks a user from ringing you, globally")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("Select a user to unblock")
				.setRequired(true),
		),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser("user", true);
		await router.dispatch(interaction, "/filter/global/members", {
			method: "POST",
			queryParams: { intent: "block", remove: user.id },
			flags: [MessageFlags.Ephemeral],
		});
	},
};
