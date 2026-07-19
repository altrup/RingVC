import {
	ChannelType,
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { RingRouter } from "@routes/types";

export const filter = {
	data: new SlashCommandBuilder()
		.setName("filter")
		.setDescription("View and edit your global or voice channel filter")
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription("The channel whose filter to open (global if omitted)")
				.addChannelTypes(ChannelType.GuildVoice)
				.setRequired(false),
		),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		const channel = interaction.options.getChannel("channel");
		await router.dispatch(interaction, `/filter/${channel?.id ?? "global"}`, {
			flags: [MessageFlags.Ephemeral],
		});
	},
};
