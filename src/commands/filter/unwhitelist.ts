import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";

import { DiscordUser } from "@main/classes/commands/discord-user";
import { DataType } from "@main/data";

export const unwhitelist = {
	data: new SlashCommandBuilder()
		.setName('unwhitelist')
		.setDescription('Removes a user from your global whitelist')
		.addUserOption(option => 
			option.setName('user')
				.setDescription('Select a user to unwhitelist')
				.setRequired(true)),
	async execute(data: DataType, interaction: ChatInputCommandInteraction) {
		const user = interaction.user;
		const whitelistUser = interaction.options.getUser('user', true);

		const discordUser = data.users.get(user.id)?? new DiscordUser(user.id);
		const globalFilter = discordUser.getFilter();

		if (!globalFilter.getIsWhitelist()) {
			interaction.reply({
				content: `Your global filter is not a whitelist. Either change it to a whitelist (\`/edit_filter type Whitelist\`) or use \`/unblock\` instead`,
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
			return;
		}

		if (!globalFilter.hasUser(whitelistUser.id)) {
			interaction.reply({
				content: `${whitelistUser} isn't whitelisted`,
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
			return;
		}

		// otherwise, add the user to the global filter
		globalFilter.removeUser(whitelistUser.id);
		interaction.reply({
			content: `${whitelistUser} has been unwhitelisted`,
			flags: [MessageFlags.Ephemeral]
		}).catch(console.error);
	},
};