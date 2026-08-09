import {
	ChannelType,
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { RingRouter } from "@routes/types";

// the panel is reachable under two names while the old one is retired
export const defaultRingeesCommand = (name: string) => ({
	data: new SlashCommandBuilder()
		.setName(name)
		.setDescription("Configure your default ringees and auto-ring")
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription("The channel whose ringees to open (global if omitted)")
				.addChannelTypes(ChannelType.GuildVoice)
				.setRequired(false),
		),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		const channel = interaction.options.getChannel("channel");
		await router.dispatch(interaction, `/ringees/${channel?.id ?? "global"}`, {
			flags: [MessageFlags.Ephemeral],
		});
	},
});

export const defaultRingees = defaultRingeesCommand("default_ringees");
