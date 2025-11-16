import { ChannelType, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";

import { DiscordUser } from "@main/classes/commands/discord-user";
import { DataType } from "@main/data";
import { Filter } from "@main/classes/commands/filter";

export const filter = {
	data: new SlashCommandBuilder()
		.setName('filter')
		.setDescription('Configure your global filter or specified voice chat filter')
		.addSubcommand(subcommand =>
			subcommand.setName("help")
			.setDescription("Show information for the /filter command"))
		.addSubcommand(subcommand =>
			subcommand.setName("get")
			.setDescription("Get the global filter or specified voice chat filter")
			.addChannelOption(option =>
				option.setName("channel")
				.setDescription("The channel to get the filter for")
				.addChannelTypes(ChannelType.GuildVoice)
				.setRequired(false)))
		.addSubcommand(subcommand =>
			subcommand.setName('reset')
			.setDescription('Resets a filter. Also resets to blacklist')
			.addChannelOption(option => 
				option.setName('channel')
				.setDescription('Resets this voice channel\'s filter. Leave blank for your global filter')
				.addChannelTypes(ChannelType.GuildVoice)
				.setRequired(false)))
		.addSubcommandGroup(group =>
			group.setName("edit")
				.setDescription('Edit a filter')
				.addSubcommand(subcommand =>
					subcommand.setName("users")
					.setDescription("Add or remove a user from the filter list")
					.addIntegerOption(option =>
						option.setName("action")
						.setDescription("Choose to add or remove users")
						.addChoices(
							{name: "Add", value: 1},
							{name: "Remove", value: 0}
						)
						.setRequired(true))
					.addUserOption(option =>
						option.setName("user")
						.setDescription("Person that will be added or removed from the filter")
						.setRequired(true))
					.addChannelOption(option =>
						option.setName("channel")
						.setDescription("Which channel's filter to modify. Leave blank to edit your global filter")
						.addChannelTypes(ChannelType.GuildVoice)
						.setRequired(false)))
				.addSubcommand(subcommand => 
					subcommand.setName("type")
					.setDescription("Change the filter type. WARNING: RESETS LIST")
					.addStringOption(option =>
						option.setName("filter_type")
						.setDescription("Choose the new filter type. If the filter is already that type, nothing changes")
						.addChoices(
							{name: "Whitelist", value: "whitelist"},
							{name: "Blacklist", value: "blacklist"}
						)
						.setRequired(true))
					.addChannelOption(option =>
						option.setName("channel")
						.setDescription("Which channel's filter to modify. Leave blank to edit your global filter")
						.addChannelTypes(ChannelType.GuildVoice)
						.setRequired(false)))),
	async execute(data: DataType, interaction: ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand();
		if (subcommand === "help") {
			// Show help information
			interaction.reply({
				embeds: [
					new EmbedBuilder()
					.setColor('#94ab62')
					.setTitle('/filter')
					.setDescription('This command allows you to configure your filters')
					.addFields(
						{ name: 'help', value: 'Show this help message' },
						{ name: 'edit users', value: 'Add or remove users from either your global filter or specified channel filter' },
						{ name: 'edit type', value: 'Change the filter type of your global filter or specified channel filter.\n*WARNING: RESETS LIST*' },
						{ name: 'get', value: 'View either your global filter or specified channel filter' },
						{ name: 'reset', value: 'Resets either your global filter or specified channel filter' },
					)
				],
				flags: [MessageFlags.Ephemeral]
			});
		} else if (subcommand === "get") {
			const currentUser = interaction.user; // user who started the command
			const channel = interaction.options.getChannel("channel");
			if (channel) {
				const discordUser = data.users.get(currentUser.id);
				const filter = discordUser?.getFilter(channel.id);
				if (!filter) {
					interaction.reply({
						content: `__List of people in your blacklist for ${channel}__\nNone`,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
				} else {
					let userList = "";
					filter.getList().forEach((_, key) => {
						userList += `<@${key}>\n`;
					});
					
					interaction.reply({
						content: `__List of people in your ${filter.getType()} for ${channel}__\n${userList? userList: "None"}`,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
				}
			} else {
				const discordUser = data.users.get(currentUser.id);
				if (!discordUser) {
					interaction.reply({
						content: `__List of people in your global blacklist__\nNone`,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
				} else {
					const filter = discordUser.getFilter();
					let userList = "";
					filter.getList().forEach((_, key) => {
						userList += `<@${key}>\n`;
					});
					
					interaction.reply({
						content: `__List of people in your global ${filter.getType()}__\n${userList? userList: "None"}`,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
				}
			}
		} else if (subcommand === "users") {
		// modifying users list
			const currentUser = interaction.user; // user who started the command
			const channel = interaction.options.getChannel("channel");
			const addOrRemove = interaction.options.getInteger("action", true); // 1 for add 0 for remove
			const user = interaction.options.getUser("user", true);
			if (channel) {
				const discordUser = data.users.get(currentUser.id)?? new DiscordUser(currentUser.id);
				const filter = discordUser.getFilter(channel.id)?? discordUser.addFilter(channel.id);
				
				if (addOrRemove === 1) {
					filter.addUser(user.id);
					interaction.reply({
						content: `Added ${user} to your ${filter.getType()} for ${channel}`,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
				} else {
					if (filter.hasUser(user.id)) {
						filter.removeUser(user.id);
						interaction.reply({
							content: `Removed ${user} from your ${filter.getType()} for ${channel}`,
							flags: [MessageFlags.Ephemeral]
						}).catch(console.error);
					} else {
						interaction.reply({
							content: `${user} was not in your ${filter.getType()} for ${channel}`,
							flags: [MessageFlags.Ephemeral]
						}).catch(console.error);
					}
				}
			} else {
				let discordUser = data.users.get(currentUser.id);
				if (!discordUser) {
					discordUser = new DiscordUser(currentUser.id);
				} else {
					const filter = discordUser.getFilter();
					if (addOrRemove === 1) {
						filter.addUser(user.id);
						interaction.reply({
							content: `Added ${user} to your global ${filter.getType()}`,
							flags: [MessageFlags.Ephemeral]
						}).catch(console.error);
					} else {
						if (filter.hasUser(user.id)) {
							filter.removeUser(user.id);
							interaction.reply({
								content: `Removed ${user} from your global ${filter.getType()}`,
								flags: [MessageFlags.Ephemeral]
							}).catch(console.error);
						} else {
							interaction.reply({
								content: `${user} was not in your global ${filter.getType()}`,
								flags: [MessageFlags.Ephemeral]
							}).catch(console.error);
						}
					}
				}
			}
		} else if (subcommand === "type") {
			const currentUser = interaction.user; // user who started the command
			const channel = interaction.options.getChannel("channel");
			const type = interaction.options.getString("filter_type", true); // string of either "whitelist" or "blacklist"
			if (channel) {
				if (channel.type !== ChannelType.GuildVoice) {
					interaction.reply({
						content: `Filters are only available on voice channels`,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
					return; // stop the rest of function
				}

				const discordUser = data.users.get(currentUser.id)?? new DiscordUser(currentUser.id);
				const filter = discordUser.getFilter(channel.id)?? discordUser.addFilter(channel.id);
				
				if (filter.getType() === type) {
					interaction.reply({
						content: `Your filter for ${channel} is already a \`${type}\``,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
				} else {
					filter.setType(type);
					interaction.reply({
						content: `Your filter for ${channel} was reset and changed to a \`${type}\``,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
				}
			} else {
				let discordUser = data.users.get(currentUser.id);
				if (!discordUser) {
					discordUser = new DiscordUser(currentUser.id);
				} else {
					const filter = discordUser.getFilter();
					if (filter.getType() === type) {
						interaction.reply({
							content: `Your global filter is already a \`${type}\``,
							flags: [MessageFlags.Ephemeral]
						}).catch(console.error);
					} else {
						filter.setType(type);
						interaction.reply({
							content: `Your global filter was reset and changed to a \`${type}\``,
							flags: [MessageFlags.Ephemeral]
						}).catch(console.error);
					}
				}
			}
		} else if (subcommand === "reset") {
			const currentUser = interaction.user; // user who started the command
			const channel = interaction.options.getChannel("channel");
			// if they inputted a channel
			if (channel) {
				const filter = data.users.get(currentUser.id)?.getFilter(channel.id);
				if (!filter || Filter.isDefault(filter.getIsWhitelist(), filter.getList()))
					interaction.reply({
						content: `Your filter for ${channel} is already the default (blacklist with no users)`,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
				else {
					filter.setType("blacklist"); // also resets filter
					
					interaction.reply({
						content: `Filter for ${channel} has been reset and is now a ${filter.getType()}`,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
				}
			}
			else {
				const filter = data.users.get(currentUser.id)?.getFilter();
				if (!filter || Filter.isDefault(filter.getIsWhitelist(), filter.getList())) {
					interaction.reply({
						content: `Your global filter is already the default (blacklist with no users)`,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
				} else {
					filter.setType("blacklist"); // also resets filter
					
					interaction.reply({
						content: `Your global filter has been reset and is now a ${filter.getType()}`,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
				}
			}
		}
	},
};