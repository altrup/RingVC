import { RingRouter } from "@routes/types";
import {
	ChannelType,
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

export const unsignup = {
	data: new SlashCommandBuilder()
		.setName("unsignup")
		.setDescription('Stop being "rung" for a voice chat')
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription('Select the channel to stop being "rung" for')
				.addChannelTypes(ChannelType.GuildVoice)
				.setRequired(false),
		),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		const channel =
			interaction.options.getChannel("channel") ??
			(interaction.channel?.type === ChannelType.GuildVoice
				? interaction.channel
				: null);
		if (channel) {
			await router.dispatch(interaction, "/signups/members", {
				method: "POST",
				queryParams: { remove: channel.id },
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}
		await router.dispatch(interaction, "/signups", {
			flags: [MessageFlags.Ephemeral],
		});
	},
};
