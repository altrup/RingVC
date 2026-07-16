import {
	ChannelType,
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { RingRouter } from "@routes/types";

export const signup = {
	data: new SlashCommandBuilder()
		.setName("signup")
		.setDescription('Sign up to get "rung" when someone starts a call')
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription('Select the channel to be "rung" for')
				.addChannelTypes(ChannelType.GuildVoice)
				.setRequired(false),
		),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		// with an explicit channel, or run bare inside a VC's text chat, keep
		// the quick-signup behavior; bare anywhere else opens the panel
		const channel =
			interaction.options.getChannel("channel") ??
			(interaction.channel?.type === ChannelType.GuildVoice
				? interaction.channel
				: null);
		if (channel) {
			await router.dispatch(interaction, "/signups/members", {
				method: "POST",
				queryParams: { add: channel.id },
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}
		await router.dispatch(interaction, "/signups", {
			flags: [MessageFlags.Ephemeral],
		});
	},
};
