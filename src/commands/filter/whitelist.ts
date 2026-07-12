import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { CommandName } from "@commands/commandNames";
import { addFilterEntry, getFilter } from "@db/filters";

export const whitelist = {
	data: new SlashCommandBuilder()
		.setName("whitelist")
		.setDescription("Adds a user to your global whitelist")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("Select a user to whitelist")
				.setRequired(true),
		),
	async execute(
		interaction: ChatInputCommandInteraction,
		commandIds: Map<CommandName, string>,
	) {
		const user = interaction.user;
		const whitelistedUser = interaction.options.getUser("user", true);

		const globalFilter = await getFilter(user.id, null);

		if (!globalFilter?.isWhitelist) {
			interaction
				.reply({
					content: `Your global filter is not a whitelist. Either change it to a whitelist (</filter edit type:${commandIds.get("filter")}>) or use </block:${commandIds.get("block")}> instead`,
					flags: [MessageFlags.Ephemeral],
				})
				.catch(console.error);
			return;
		}

		if (globalFilter.entries.has(whitelistedUser.id)) {
			interaction
				.reply({
					content: `${whitelistedUser} is already whitelisted`,
					flags: [MessageFlags.Ephemeral],
				})
				.catch(console.error);
			return;
		}

		// otherwise, add the user to the global filter
		await addFilterEntry(user.id, null, whitelistedUser.id);
		interaction
			.reply({
				content: `${whitelistedUser} has been whitelisted`,
				flags: [MessageFlags.Ephemeral],
			})
			.catch(console.error);
	},
};
