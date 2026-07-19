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
				.setDescription("Select the channel to remove the role from")
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
		// without a channel, open the role's panel to pick which to remove; the
		// panel's Reset button covers clearing every channel behind its confirm
		if (!channel) {
			await router.dispatch(interaction, `/signups/roles/by-role/${role.id}`, {
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}
		await router.dispatch(
			interaction,
			`/signups/roles/by-role/${role.id}/channels`,
			{
				method: "POST",
				queryParams: { remove: channel.id },
				flags: [MessageFlags.Ephemeral],
			},
		);
	},
};
