import { ChannelType, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";

import { DiscordUser } from "@main/classes/commands/discord-user";
import { DataType } from "@main/data";

export const editFilter = {
	data: new SlashCommandBuilder()
		.setName('edit_filter')
		.setDescription('Edit your filter for a voice chat')
		.addSubcommand(subcommand =>
			subcommand.setName("users")
			.setDescription("Add or remove a user from the filter list")
			.addIntegerOption(option =>
				option.setName("add_or_remove")
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
				.addChannelTypes(2)
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
				.addChannelTypes(2)
				.setRequired(false))),
	async execute(data: DataType, interaction: ChatInputCommandInteraction) {
		// modifying users list
		if (interaction.options.getSubcommand() === "users") {
			const currentUser = interaction.user; // user who started the command
			const channel = interaction.options.getChannel("channel");
			const addOrRemove = interaction.options.getInteger("add_or_remove", true); // 1 for add 0 for remove
			const user = interaction.options.getUser("user", true);
			if (channel) {
				const discordUser = data.users.get(currentUser.id);
				// if user doesn't exist or hasn't signed up for that voice channel
				const filter = discordUser?.getFilter(channel.id);
				if (!filter) 
					interaction.reply({
						content: `You have not yet signed up for ${channel}`,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
				else {
					if (addOrRemove === 1) {
						filter.addUser(user.id);
						interaction.reply({
							content: `Added ${user} to your ${filter.getType()} for ${channel}`,
							flags: [MessageFlags.Ephemeral]
						}).catch(console.error);
					}
					else {
						if (filter.hasUser(user.id)) {
							filter.removeUser(user.id);
							interaction.reply({
								content: `Removed ${user} from your ${filter.getType()} for ${channel}`,
								flags: [MessageFlags.Ephemeral]
							}).catch(console.error);
						}
						else
							interaction.reply({
								content: `${user} was not in your ${filter.getType()} for ${channel}`,
								flags: [MessageFlags.Ephemeral]
							}).catch(console.error);
					}
				}
			}
			else {
				let discordUser = data.users.get(currentUser.id);
				if (!discordUser)
					discordUser = new DiscordUser(currentUser.id);
				else {
					const filter = discordUser.getFilter();
					if (addOrRemove === 1) {
						filter.addUser(user.id);
						interaction.reply({
							content: `Added ${user} to your global ${filter.getType()}`,
							flags: [MessageFlags.Ephemeral]
						}).catch(console.error);
					}
					else {
						if (filter.hasUser(user.id)) {
							filter.removeUser(user.id);
							interaction.reply({
								content: `Removed ${user} from your global ${filter.getType()}`,
								flags: [MessageFlags.Ephemeral]
							}).catch(console.error);
						}
						else
							interaction.reply({
								content: `${user} was not in your global ${filter.getType()}`,
								flags: [MessageFlags.Ephemeral]
							}).catch(console.error);
					}
				}
			}
		}
		else if (interaction.options.getSubcommand() === "type") {
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

				const discordUser = data.users.get(currentUser.id);
				const filter = discordUser?.getFilter(channel.id);
				// if user doesn't exist or hasn't signed up for that voice channel
				if (!filter) 
					interaction.reply({
						content: `You have not yet signed up for ${channel}`,
						flags: [MessageFlags.Ephemeral]
					}).catch(console.error);
				else {
					if (filter.getType() === type)
						interaction.reply({
							content: `Your filter for ${channel} is already a ${type}`,
							flags: [MessageFlags.Ephemeral]
						}).catch(console.error);
					else {
						filter.setType(type);
						interaction.reply({
							content: `Your filter for ${channel} was reset and changed to a ${type}`,
							flags: [MessageFlags.Ephemeral]
						}).catch(console.error);
					}

				}
			}
			else {
				let discordUser = data.users.get(currentUser.id);
				if (!discordUser) 
					discordUser = new DiscordUser(currentUser.id); 
				else {
					const filter = discordUser.getFilter();
					if (filter.getType() === type)
						interaction.reply({
							content: `Your global filter is already a ${type}`,
							flags: [MessageFlags.Ephemeral]
						}).catch(console.error);
					else {
						filter.setType(type);
						interaction.reply({
							content: `Your global filter was reset and changed to a ${type}`,
							flags: [MessageFlags.Ephemeral]
						}).catch(console.error);
					}

				}
			}

		}

	},
};