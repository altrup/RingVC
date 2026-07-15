import { RingRouter } from "@routes/types";
import {
	ChannelType,
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

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
		// a channel removes just that link; clearing every channel is
		// destructive, so it goes through the same typed-confirmation modal as
		// the panel's Reset button
		if (channel)
			await router.dispatch(
				interaction,
				`/signups/roles/by-role/${role.id}/channels`,
				{
					method: "POST",
					queryParams: { remove: channel.id },
					flags: [MessageFlags.Ephemeral],
				},
			);
		else
			await router.dispatch(
				interaction,
				`/signups/roles/by-role/${role.id}/reset`,
				{ method: "MODAL", flags: [MessageFlags.Ephemeral] },
			);
	},
};
