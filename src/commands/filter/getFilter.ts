import { ChannelType, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";

import { DataType } from "@main/data";

export const getFilter = {
	data: new SlashCommandBuilder()
		.setName('get_filter')
		.setDescription('Gets the type and list of users of a filter')
		.addChannelOption(option => 
			option.setName('channel')
			.setDescription('Get this voice channel\'s filter. Leave blank to get global filter')
			.addChannelTypes(ChannelType.GuildVoice)
			.setRequired(false)),
	async execute(data: DataType, interaction: ChatInputCommandInteraction) {
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
		}
		else {
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

	},
};