import { ChannelType, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";

import { DataType } from "@main/data";
import { DiscordUser } from "@main/classes/commands/discord-user";

export const defaultRingRecipients = {
	data: new SlashCommandBuilder()
		.setName('default_ring_recipients')
		.setDescription('Configure your default ring recipients')
		.addSubcommand(subcommand =>
			subcommand.setName('add')
				.setDescription('Add a user to your default ring recipients')
				.addUserOption(option =>
					option.setName('user')
						.setDescription('The user to add to your default ring recipients')
						.setRequired(true))
				.addChannelOption(option =>
					option.setName('channel')
						.setDescription('The channel to add the user as a default ring recipient for (global if not specified)')
						.addChannelTypes(ChannelType.GuildVoice)
						.setRequired(false)))
		.addSubcommand(subcommand =>
			subcommand.setName('remove')
				.setDescription('Remove a user from your default ring recipients')
				.addUserOption(option =>
					option.setName('user')
						.setDescription('The user to remove from your default ring recipients')
						.setRequired(true))
				.addChannelOption(option =>
					option.setName('channel')
						.setDescription('The channel to remove the user as a default ring recipient for (global if not specified)')
						.addChannelTypes(ChannelType.GuildVoice)
						.setRequired(false)))
		.addSubcommand(subcommand =>
			subcommand.setName('list')
				.setDescription('List your default ring recipients')
				.addChannelOption(option =>
					option.setName('channel')
						.setDescription('The channel to list the default ring recipients for (global if not specified)')
						.addChannelTypes(ChannelType.GuildVoice)
						.setRequired(false)))
		.addSubcommand(subcommand =>
			subcommand.setName('clear')
				.setDescription('Clears your default ring recipients')
				.addChannelOption(option =>
					option.setName('channel')
						.setDescription('The channel to clear the default ring recipients for')
						.addChannelTypes(ChannelType.GuildVoice)
						.setRequired(false)))
		.addSubcommandGroup(subcommand =>
			subcommand.setName('auto_ring')
				.setDescription('Configure automatic ringing when you join a voice channel')
				.addSubcommand(subcommand =>
					subcommand.setName('set')
						.setDescription('Set the automatic ringing options')
						.addBooleanOption(option =>
							option.setName('enabled')
								.setDescription('Whether or not to enable automatic ringing')
								.setRequired(true))
						.addChannelOption(option =>
							option.setName('channel')
								.setDescription('The channel to set automatic ringing for (global if not specified)')
								.addChannelTypes(ChannelType.GuildVoice)
								.setRequired(false)))
				.addSubcommand(subcommand =>
					subcommand.setName('get')
						.setDescription('View your automatic ringing settings')
						.addChannelOption(option =>
							option.setName('channel')
								.setDescription('The channel to view automatic ringing settings for (global if not specified)')
								.addChannelTypes(ChannelType.GuildVoice)
								.setRequired(false)))),
	async execute(data: DataType, interaction: ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand();
		if (subcommand === "add") {
			// Add user to default ring recipients
			const userToAdd = interaction.options.getUser('user', true);
			const channel = interaction.options.getChannel('channel');

			const discordUser = data.users.get(interaction.user.id) ?? new DiscordUser(interaction.user.id);

			if (discordUser.addDefaultRingeeUserId(channel?.id, userToAdd.id)) {
				interaction.reply({
					content: `${userToAdd} is now a${!channel ? " global" : ""} default ring recipients${channel ? ` for ${channel}` : ""}`,
					flags: [MessageFlags.Ephemeral]
				}).catch(console.error);
			} else {
				interaction.reply({
					content: `${userToAdd} is a${!channel ? " global" : ""} default ring recipient${channel ? ` for ${channel}` : ""}`,
					flags: [MessageFlags.Ephemeral]
				}).catch(console.error);
			}
		} else if (subcommand === "remove") {
			// Remove user from default ring recipients
			const userToRemove = interaction.options.getUser('user', true);
			const channel = interaction.options.getChannel('channel');

			const discordUser = data.users.get(interaction.user.id) ?? new DiscordUser(interaction.user.id);

			if (discordUser.removeDefaultRingeeUserId(channel?.id, userToRemove.id)) {
				interaction.reply({
					content: `${userToRemove} is no longer a${!channel ? " global" : ""} default ring recipient${channel ? ` for ${channel}` : ""}`,
					flags: [MessageFlags.Ephemeral]
				}).catch(console.error);
			} else {
				interaction.reply({
					content: `${userToRemove} is not a${!channel ? " global" : ""} default ring recipient${channel ? ` for ${channel}` : ""}`,
					flags: [MessageFlags.Ephemeral]
				}).catch(console.error);
			}
		} else if (subcommand === "list") {
			// List default ring recipients
			const channel = interaction.options.getChannel('channel');

			const discordUser = data.users.get(interaction.user.id);
			const defaultRingees = discordUser?.getDefaultRingeeUserIds(channel?.id);
			const defaultRingeesString = defaultRingees && defaultRingees.size > 0 ?
				Array.from(defaultRingees.keys()).map(userId => DiscordUser.toString(userId)).join("\n") :
				"None";
			interaction.reply({
				content: `__Your${!channel ? " global" : ""} default ring recipients${channel ? ` for ${channel}` : ""}__\n${defaultRingeesString}`,
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
		} else if (subcommand === "clear") {
			// Reset default ring recipients
			const channel = interaction.options.getChannel('channel');

			const discordUser = data.users.get(interaction.user.id);
			if (discordUser?.clearDefaultRingeeUserIds(channel?.id)) {
				interaction.reply({
					content: `Your${!channel ? " global" : ""} default ring recipients${channel ? ` for ${channel}` : ""} have been cleared.`,
					flags: [MessageFlags.Ephemeral]
				}).catch(console.error);
			} else {
				interaction.reply({
					content: `You already have no${!channel ? " global" : ""} default ring recipients${channel ? ` for ${channel}` : ""}.`,
					flags: [MessageFlags.Ephemeral]
				}).catch(console.error);
			}
		} else if (subcommand === "set") {
			// Enable/disable auto ringing
			const enabled = interaction.options.getBoolean('enabled', true);
			const channel = interaction.options.getChannel('channel');

			const discordUser = data.users.get(interaction.user.id) ?? new DiscordUser(interaction.user.id);
			if (discordUser.setAutoRingEnabled(channel?.id, enabled)) {
				interaction.reply({
					content: `Automatic ringing when you join a voice channel is now \`${enabled ? "enabled" : "disabled"}\`.\n
					WARNING: This will cause you to ring all of your default ring recipients every time you join a voice channel, even if you are in \`stealth\` mode.`,
					flags: [MessageFlags.Ephemeral]
				}).catch(console.error);
			} else {
				interaction.reply({
					content: `Automatic ringing when you join a voice channel is already \`${enabled ? "enabled" : "disabled"}\`.`,
					flags: [MessageFlags.Ephemeral]
				}).catch(console.error);
			}
		} else if (subcommand === "get") {
			// Get auto ringing status
			const channel = interaction.options.getChannel('channel');

			const discordUser = data.users.get(interaction.user.id);
			const autoRingEnabled = discordUser?.isAutoRingEnabled(channel?.id);
			interaction.reply({
				content: `Automatic ringing when you join a voice channel is \`${autoRingEnabled ? "enabled" : "disabled"}\`${channel ? ` for ${channel}` : " globally"}.`,
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
		}
	},
};