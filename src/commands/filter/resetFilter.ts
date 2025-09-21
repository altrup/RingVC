import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";

import { DiscordUser } from "@main/classes/commands/discord-user";
import { DataType } from "@src/main/data";

export const resetFilter = {
	data: new SlashCommandBuilder()
		.setName('reset_filter')
		.setDescription('Resets a filter. Also resets to blacklist')
		.addChannelOption(option => 
			option.setName('channel')
			.setDescription('Resets this voice channel\'s filter. Leave blank for your global filter')
			.addChannelTypes(2)
			.setRequired(false)),
	async execute(data: DataType, interaction: ChatInputCommandInteraction) {
		const currentUser = interaction.user; // user who started the command
		const channel = interaction.options.getChannel("channel");
		// if they inputted a channel
		if (channel) {
			const discordUser = data.users.get(currentUser.id);
			const filter = discordUser?.getFilter(channel.id);
			if (!filter)
				interaction.reply({
					content: `You have not yet signed up for ${channel}`,
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
			let discordUser = data.users.get(currentUser.id);
			if (!discordUser)
				discordUser = new DiscordUser(currentUser.id, []);
			else {
				const filter = discordUser.getFilter();
				filter.setType("blacklist"); // also resets filter
				
				interaction.reply({
					content: `Your global filter has been reset and is now a ${filter.getType()}`,
					flags: [MessageFlags.Ephemeral]
				}).catch(console.error);
			}
		}

	},
};