import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { CommandName } from "@commands/commandNames";
import { getFilter, removeFilterEntry } from "@main/db/filters";

export const unwhitelist = {
	data: new SlashCommandBuilder()
		.setName("unwhitelist")
		.setDescription("Removes a user from your global whitelist")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("Select a user to unwhitelist")
				.setRequired(true),
		),
	async execute(
		interaction: ChatInputCommandInteraction,
		commandIds: Map<CommandName, string>,
	) {
		const user = interaction.user;
		const whitelistUser = interaction.options.getUser("user", true);

		const globalFilter = await getFilter(user.id, null);

		if (!globalFilter?.isWhitelist) {
			interaction
				.reply({
					content: `Your global filter is not a whitelist. Either change it to a whitelist (</filter edit type:${commandIds.get("filter")}>) or use </unblock:${commandIds.get("unblock")}> instead`,
					flags: [MessageFlags.Ephemeral],
				})
				.catch(console.error);
			return;
		}

		if (!globalFilter.entries.has(whitelistUser.id)) {
			interaction
				.reply({
					content: `${whitelistUser} isn't whitelisted`,
					flags: [MessageFlags.Ephemeral],
				})
				.catch(console.error);
			return;
		}

		// otherwise, remove the user from the global filter
		await removeFilterEntry(user.id, null, whitelistUser.id);
		interaction
			.reply({
				content: `${whitelistUser} has been unwhitelisted`,
				flags: [MessageFlags.Ephemeral],
			})
			.catch(console.error);
	},
};
