import { ChannelType, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";

import { DataType } from "@main/data";
import { Filter } from "@main/classes/commands/filter";

export const resetFilter = {
	data: new SlashCommandBuilder()
		.setName('reset_filter')
		.setDescription('Resets a filter. Also resets to blacklist')
		.addChannelOption(option => 
			option.setName('channel')
			.setDescription('Resets this voice channel\'s filter. Leave blank for your global filter')
			.addChannelTypes(ChannelType.GuildVoice)
			.setRequired(false)),
	async execute(data: DataType, interaction: ChatInputCommandInteraction) {
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

	},
};