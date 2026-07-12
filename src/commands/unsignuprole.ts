import {
	ChannelType,
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { RingRouter } from "@routes/types";

export const unsignuprole = {
	data: new SlashCommandBuilder()
		.setName("unsignuprole")
		.setDescription("Stop a role from being pinged for a voice chat")
		.addRoleOption((option) =>
			option
				.setName("role")
				.setDescription("Select the role to remove")
				.setRequired(true),
		)
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription(
					"Select the channel to remove the role from (all channels if omitted)",
				)
				.addChannelTypes(ChannelType.GuildVoice)
				.setRequired(false),
		),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		const role = interaction.options.getRole("role", true);
		const channel = interaction.options.getChannel("channel");
		await router.dispatch(interaction, "/signups/roles/remove", {
			method: "POST",
			queryParams: {
				role: role.id,
				...(channel ? { channel: channel.id } : {}),
			},
			flags: [MessageFlags.Ephemeral],
		});
	},
};
