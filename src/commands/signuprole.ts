import { RingRouter } from "@routes/types";
import {
	ChannelType,
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

export const signuprole = {
	data: new SlashCommandBuilder()
		.setName("signuprole")
		.setDescription("Sign up a role to get pinged when someone starts a call")
		.addRoleOption((option) =>
			option
				.setName("role")
				.setDescription("Select the role to be pinged")
				.setRequired(true),
		)
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription("Select the channel for the role to be pinged in")
				.addChannelTypes(ChannelType.GuildVoice)
				.setRequired(false),
		),
	async execute(router: RingRouter, interaction: ChatInputCommandInteraction) {
		const role = interaction.options.getRole("role", true);
		const channel =
			interaction.options.getChannel("channel") ??
			(interaction.channel?.type === ChannelType.GuildVoice
				? interaction.channel
				: null);
		// without a channel, land on the role's channel-pick page
		if (!channel) {
			await router.dispatch(interaction, `/signups/roles/${role.id}`, {
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}
		await router.dispatch(interaction, `/signups/roles/${role.id}`, {
			method: "POST",
			queryParams: { channel: channel.id },
			flags: [MessageFlags.Ephemeral],
		});
	},
};
