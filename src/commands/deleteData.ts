import { RingRouter } from "@routes/types";
import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

export const deleteData = {
	data: new SlashCommandBuilder()
		.setName("delete_data")
		.setDescription("Delete all your data stored for this bot"),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		await router.dispatch(interaction, "/delete-data", {
			flags: [MessageFlags.Ephemeral],
		});
	},
};
