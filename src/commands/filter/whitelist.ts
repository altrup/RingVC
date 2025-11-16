import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';

import { DiscordUser } from '@main/classes/commands/discord-user';
import { DataType } from '@main/data';
import { CommandName } from '@commands/commandNames';

export const whitelist = {
	data: new SlashCommandBuilder()
		.setName('whitelist')
		.setDescription('Adds a user to your global whitelist')
		.addUserOption(option => 
			option.setName('user')
				.setDescription('Select a user to whitelist')
				.setRequired(true)),
	async execute(data: DataType, interaction: ChatInputCommandInteraction, commandIds: Map<CommandName, string>) {
		const user = interaction.user;
		const whitelistedUser = interaction.options.getUser('user', true);

		const discordUser = data.users.get(user.id)?? new DiscordUser(user.id);
		const globalFilter = discordUser.getFilter();

		if (!globalFilter.getIsWhitelist()) {
			interaction.reply({
				content: `Your global filter is not a whitelist. Either change it to a whitelist (</filter edit type:${commandIds.get("filter")}>) or use </block:${commandIds.get("block")}> instead`,
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
			return;
		}

		if (globalFilter.hasUser(whitelistedUser.id)) {
			interaction.reply({
				content: `${whitelistedUser} is already whitelisted`,
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
			return;
		}

		// otherwise, add the user to the global filter
		globalFilter.addUser(whitelistedUser.id);
		interaction.reply({
			content: `${whitelistedUser} has been whitelisted`,
			flags: [MessageFlags.Ephemeral]
		}).catch(console.error);
	},
};