import { ChannelType, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";

import { DataType } from "@main/data";
import { DiscordUser } from "@main/classes/commands/discord-user";

export const defaultRingRecipients = {
	data: new SlashCommandBuilder()
		.setName('default_ring_recipients')
		.setDescription('Configure your default ring recipients')
		.addSubcommand(subcommand =>
			subcommand.setName('help')
				.setDescription('Show information for the default_ring_recipients command'))
		.addSubcommand(subcommand =>
			subcommand.setName('edit')
				.setDescription('Edit your default ring recipients')
				.addIntegerOption(option =>
					option.setName("action")
					.setDescription("Choose to add or remove a default ring recipient")
					.addChoices(
						{name: "Add", value: 1},
						{name: "Remove", value: 0}
					)
					.setRequired(true))
				.addUserOption(option =>
					option.setName('user')
						.setDescription('The user to add/remove as a default ring recipient')
						.setRequired(true))
				.addChannelOption(option =>
					option.setName('channel')
						.setDescription('The channel to add/remove the default ring recipient for (global if not specified)')
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
		.addSubcommandGroup(group =>
			group.setName('auto_ring')
				.setDescription('Configure automatic ringing when you join a voice channel')
				.addSubcommand(subcommand =>
					subcommand.setName('set')
						.setDescription('Set automatic ringing for a channel or globally')
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
					subcommand.setName('unset')
						.setDescription('Unset automatic ringing override for a channel')
						.addChannelOption(option =>
							option.setName('channel')
								.setDescription('The channel to unset automatic ringing')
								.addChannelTypes(ChannelType.GuildVoice)
								.setRequired(true)))
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
		if (subcommand === "help") {
			// Show help information
			interaction.reply({
				embeds: [
					new EmbedBuilder()
					.setColor('#747ac5')
					.setTitle('/default_ring_recipients')
					.setDescription('This command allows you to configure your default ring recipients, which are used when running `/ring default` or if you have automatic ringing enabled')
					.addFields(
						{ name: 'help', value: 'Show this help message' },
						{ name: 'add', value: 'Set a user as a default ring recipient, either globally, or for a specified channel' },
						{ name: 'remove', value: 'Unset a user as a default ring recipient, either globally, or for a specified channel' },
						{ name: 'list', value: 'View all default ring recipients, either globally, or for a specified channel' },
						{ name: 'clear', value: 'Clear all default ring recipients, either globally, or for a specified channel' },
						{ name: 'auto_ring set', value: 'Turn automatic ringing on or off, either globally, or for a specified channel. If a channel is specified, then global auto_ring is overridden for that channel' },
						{ name: 'auto_ring unset', value: 'Unset automatic ringing override for a channel' },
						{ name: 'auto_ring get', value: 'View whether automatic ringing is enabled, either globally, or for a specified channel' },
					)
				],
				flags: [MessageFlags.Ephemeral]
			});
		} else if (subcommand === "edit") {
			// Add user to default ring recipients
			const userToAddOrRemove = interaction.options.getUser('user', true);
			const channel = interaction.options.getChannel('channel');
			const action = interaction.options.getInteger('action', true);

			if (action === 1) {
				const discordUser = data.users.get(interaction.user.id) ?? new DiscordUser(interaction.user.id);
				if (discordUser.addDefaultRingeeUserId(channel?.id, userToAddOrRemove.id)) {
					interaction.reply({
						content: `${userToAddOrRemove} is now a${!channel ? " global" : ""} default ring recipient${channel ? ` for ${channel}` : ""}`,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
				} else {
					interaction.reply({
						content: `${userToAddOrRemove} is a${!channel ? " global" : ""} default ring recipient${channel ? ` for ${channel}` : ""}`,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
				}
			} else {
				const discordUser = data.users.get(interaction.user.id);
				if (discordUser?.removeDefaultRingeeUserId(channel?.id, userToAddOrRemove.id)) {
					interaction.reply({
						content: `${userToAddOrRemove} is no longer a${!channel ? " global" : ""} default ring recipient${channel ? ` for ${channel}` : ""}`,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
				} else {
					interaction.reply({
						content: `${userToAddOrRemove} is not a${!channel ? " global" : ""} default ring recipient${channel ? ` for ${channel}` : ""}`,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
				}
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
					content: `Automatic ringing when you join a voice channel is now \`${enabled ? "enabled" : "disabled"}\`.` +
					(enabled? `\n\nWARNING: This will cause you to ring all of your default ring recipients every time you join ${channel?? "a voice channel"}, even if you are in \`stealth\` mode.` : ""),
					flags: [MessageFlags.Ephemeral]
				}).catch(console.error);
			} else {
				interaction.reply({
					content: `Automatic ringing for ${channel?? "voice channels"} is already \`${enabled ? "enabled" : "disabled"}\`.`,
					flags: [MessageFlags.Ephemeral]
				}).catch(console.error);
			}
		} else if (subcommand === "unset") {
			// Unset auto ringing override for a channel
			const channel = interaction.options.getChannel('channel', true);

			const discordUser = data.users.get(interaction.user.id);
			if (discordUser?.unsetAutoRingEnabled(channel.id)) {
				interaction.reply({
					content: `Automatic ringing override for ${channel} has been unset. Your global automatic ringing setting will now be used.`,
					flags: [MessageFlags.Ephemeral]
				}).catch(console.error);
			} else {
				interaction.reply({
					content: `You do not have an automatic ringing override set for ${channel}.`,
					flags: [MessageFlags.Ephemeral]
				}).catch(console.error);
			}
		} else if (subcommand === "get") {
			// Get auto ringing status
			const channel = interaction.options.getChannel('channel');

			const discordUser = data.users.get(interaction.user.id);
			const autoRingOverride = channel? discordUser?.getChannelAutoRingEnableds().get(channel.id): undefined;
			const autoRingEnabled = discordUser?.isAutoRingEnabled(channel?.id);
			interaction.reply({
				content: `Default ring will${autoRingEnabled ? "" : " not"} run automatically ${channel ? `for ${channel}` : "globally"} because ` +
				(channel && autoRingOverride !== undefined ? `your override for ${channel} is set to \`${autoRingOverride ? "enabled" : "disabled"}\``: 
				((channel? `you have no override for ${channel} and `: "") + `your global auto ring is \`${autoRingEnabled ? "enabled" : "disabled"}\``)),
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
		}
	},
};