import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { CommandName } from "@commands/commandNames";
import { getFilter, removeFilterEntry } from "@db/filters";

export const unblock = {
	data: new SlashCommandBuilder()
		.setName("unblock")
		.setDescription("Unblocks a user from ringing you, globally")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("Select a user to unblock")
				.setRequired(true),
		),
	async execute(
		interaction: ChatInputCommandInteraction,
		commandIds: Map<CommandName, string>,
	) {
		const user = interaction.user;
		const blockedUser = interaction.options.getUser("user", true);

		const globalFilter = await getFilter(user.id, null);

		if (globalFilter?.isWhitelist) {
			interaction
				.reply({
					content: `Your global filter is a whitelist. Either change it to a blacklist (</filter edit type:${commandIds.get("filter")}>) or use </unwhitelist:${commandIds.get("unwhitelist")}> instead`,
					flags: [MessageFlags.Ephemeral],
				})
				.catch(console.error);
			return;
		}

		if (!globalFilter?.entries.has(blockedUser.id)) {
			interaction
				.reply({
					content: `${blockedUser} isn't blocked`,
					flags: [MessageFlags.Ephemeral],
				})
				.catch(console.error);
			return;
		}

		// otherwise, remove the user from the global filter
		await removeFilterEntry(user.id, null, blockedUser.id);
		interaction
			.reply({
				content: `${blockedUser} has been unblocked`,
				flags: [MessageFlags.Ephemeral],
			})
			.catch(console.error);
	},
};
