import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";

import { DiscordUser } from "@main/classes/commands/discord-user";
import { DataType } from "@main/data";

export const unblock = {
	data: new SlashCommandBuilder()
		.setName('unblock')
		.setDescription('Unblocks a user from ringing you, globally')
		.addUserOption(option => 
			option.setName('user')
				.setDescription('Select a user to unblock')
				.setRequired(true)),
	async execute(data: DataType, interaction: ChatInputCommandInteraction) {
		const user = interaction.user;
		const blockedUser = interaction.options.getUser('user', true);

		const discordUser = data.users.get(user.id)?? new DiscordUser(user.id);
		const globalFilter = discordUser.getFilter();

		if (globalFilter.getIsWhitelist()) {
			interaction.reply({
				content: `Your global filter is a whitelist. Either change it to a blacklist (\`/edit_filter type Blacklist\`) or use \`/unwhitelist\` instead`,
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
			return;
		}

		if (!globalFilter.hasUser(blockedUser.id)) {
			interaction.reply({
				content: `${blockedUser} isn't blocked`,
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
			return;
		}

		// otherwise, add the user to the global filter
		globalFilter.removeUser(blockedUser.id);
		interaction.reply({
			content: `${blockedUser} has been unblocked`,
			flags: [MessageFlags.Ephemeral]
		}).catch(console.error);
	},
};