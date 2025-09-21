import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';

import { DiscordUser } from '@main/classes/commands/discord-user';
import { DataType } from '@main/data';

export const block = {
	data: new SlashCommandBuilder()
		.setName('block')
		.setDescription('Blocks a user from ringing you, globally')
		.addUserOption(option => 
			option.setName('user')
				.setDescription('Select a user to block')
				.setRequired(true)),
	async execute(data: DataType, interaction: ChatInputCommandInteraction) {
		const user = interaction.user;
		const blockedUser = interaction.options.getUser('user', true);

		const discordUser = data.users.get(user.id)?? new DiscordUser(user.id);
		const globalFilter = discordUser.getFilter();
		if (globalFilter.hasUser(blockedUser.id)) {
			interaction.reply({
				content: `${blockedUser} is already blocked`,
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
			return;
		}
		// otherwise, add the user to the global filter
		globalFilter.addUser(blockedUser.id);
		interaction.reply({
			content: `${blockedUser} has been blocked`,
			flags: [MessageFlags.Ephemeral]
		}).catch(console.error);

	},
};