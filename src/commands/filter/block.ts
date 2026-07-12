import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { CommandName } from "@commands/commandNames";
import { addFilterEntry, getFilter } from "@db/filters";

export const block = {
	data: new SlashCommandBuilder()
		.setName("block")
		.setDescription("Blocks a user from ringing you, globally")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("Select a user to block")
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
					content: `Your global filter is a whitelist. Either change it to a blacklist (</filter edit type:${commandIds.get("filter")}>) or use </whitelist:${commandIds.get("whitelist")}> instead`,
					flags: [MessageFlags.Ephemeral],
				})
				.catch(console.error);
			return;
		}

		if (globalFilter?.entries.has(blockedUser.id)) {
			interaction
				.reply({
					content: `${blockedUser} is already blocked`,
					flags: [MessageFlags.Ephemeral],
				})
				.catch(console.error);
			return;
		}

		// otherwise, add the user to the global filter
		await addFilterEntry(user.id, null, blockedUser.id);
		interaction
			.reply({
				content: `${blockedUser} has been blocked`,
				flags: [MessageFlags.Ephemeral],
			})
			.catch(console.error);
	},
};
