import { RingRouter } from "@routes/types";
import {
	ChannelType,
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

export const defaultRingRecipients = {
	data: new SlashCommandBuilder()
		.setName("default_ring_recipients")
		.setDescription("Configure your default ring recipients and auto-ring")
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription(
					"The channel whose recipients to open (global if omitted)",
				)
				.addChannelTypes(ChannelType.GuildVoice)
				.setRequired(false),
		),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		const channel = interaction.options.getChannel("channel");
		await router.dispatch(
			interaction,
			`/recipients/${channel?.id ?? "global"}`,
			{ flags: [MessageFlags.Ephemeral] },
		);
	},
};
