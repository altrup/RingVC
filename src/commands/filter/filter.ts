import {
	ChannelType,
	ChatInputCommandInteraction,
	EmbedBuilder,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import {
	addFilterEntry,
	filterType,
	getFilter,
	removeFilterEntry,
	resetFilter,
	setFilterType,
} from "@db/filters";
import { mentionUser } from "@main/ring";

export const filter = {
	data: new SlashCommandBuilder()
		.setName("filter")
		.setDescription(
			"Configure your global filter or specified voice chat filter",
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("help")
				.setDescription("Show information for the /filter command"),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("get")
				.setDescription("Get the global filter or specified voice chat filter")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("The channel to get the filter for")
						.addChannelTypes(ChannelType.GuildVoice)
						.setRequired(false),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("reset")
				.setDescription("Resets a filter. Also resets to blacklist")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription(
							"Resets this voice channel's filter. Leave blank for your global filter",
						)
						.addChannelTypes(ChannelType.GuildVoice)
						.setRequired(false),
				),
		)
		.addSubcommandGroup((group) =>
			group
				.setName("edit")
				.setDescription("Edit a filter")
				.addSubcommand((subcommand) =>
					subcommand
						.setName("users")
						.setDescription("Add or remove a user from the filter list")
						.addIntegerOption((option) =>
							option
								.setName("action")
								.setDescription("Choose to add or remove users")
								.addChoices(
									{ name: "Add", value: 1 },
									{ name: "Remove", value: 0 },
								)
								.setRequired(true),
						)
						.addUserOption((option) =>
							option
								.setName("user")
								.setDescription(
									"Person that will be added or removed from the filter",
								)
								.setRequired(true),
						)
						.addChannelOption((option) =>
							option
								.setName("channel")
								.setDescription(
									"Which channel's filter to modify. Leave blank to edit your global filter",
								)
								.addChannelTypes(ChannelType.GuildVoice)
								.setRequired(false),
						),
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("type")
						.setDescription("Change the filter type. WARNING: RESETS LIST")
						.addStringOption((option) =>
							option
								.setName("filter_type")
								.setDescription(
									"Choose the new filter type. If the filter is already that type, nothing changes",
								)
								.addChoices(
									{ name: "Whitelist", value: "whitelist" },
									{ name: "Blacklist", value: "blacklist" },
								)
								.setRequired(true),
						)
						.addChannelOption((option) =>
							option
								.setName("channel")
								.setDescription(
									"Which channel's filter to modify. Leave blank to edit your global filter",
								)
								.addChannelTypes(ChannelType.GuildVoice)
								.setRequired(false),
						),
				),
		),
	async execute(interaction: ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand();
		const currentUser = interaction.user; // user who started the command
		const channel = interaction.options.getChannel("channel");
		// "your global <x>" or "your <x> for #channel"
		const scopeName = (noun: string) =>
			channel ? `your ${noun} for ${channel}` : `your global ${noun}`;
		// for the start of a sentence
		const scopeNameCapitalized = (noun: string) =>
			channel ? `Your ${noun} for ${channel}` : `Your global ${noun}`;

		if (subcommand === "help") {
			// Show help information
			interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor("#94ab62")
						.setTitle("/filter")
						.setDescription("This command allows you to configure your filters")
						.addFields(
							{ name: "help", value: "Show this help message" },
							{
								name: "edit users",
								value:
									"Add or remove users from either your global filter or specified channel filter",
							},
							{
								name: "edit type",
								value:
									"Change the filter type of your global filter or specified channel filter.\n*WARNING: RESETS LIST*",
							},
							{
								name: "get",
								value:
									"View either your global filter or specified channel filter",
							},
							{
								name: "reset",
								value:
									"Resets either your global filter or specified channel filter",
							},
						),
				],
				flags: [MessageFlags.Ephemeral],
			});
		} else if (subcommand === "get") {
			const filter = await getFilter(currentUser.id, channel?.id ?? null);
			const userList = filter
				? [...filter.entries]
						.map((userId) => `${mentionUser(userId)}\n`)
						.join("")
				: "";
			interaction
				.reply({
					content: `__List of people in ${scopeName(filterType(filter))}__\n${userList ? userList : "None"}`,
					flags: [MessageFlags.Ephemeral],
				})
				.catch(console.error);
		} else if (subcommand === "users") {
			// modifying users list
			const addOrRemove = interaction.options.getInteger("action", true); // 1 for add 0 for remove
			const user = interaction.options.getUser("user", true);

			const filter = await getFilter(currentUser.id, channel?.id ?? null);
			const type = filterType(filter);

			if (addOrRemove === 1) {
				await addFilterEntry(currentUser.id, channel?.id ?? null, user.id);
				interaction
					.reply({
						content: `Added ${user} to ${scopeName(type)}`,
						flags: [MessageFlags.Ephemeral],
					})
					.catch(console.error);
			} else {
				const removed = await removeFilterEntry(
					currentUser.id,
					channel?.id ?? null,
					user.id,
				);
				interaction
					.reply({
						content: removed
							? `Removed ${user} from ${scopeName(type)}`
							: `${user} was not in ${scopeName(type)}`,
						flags: [MessageFlags.Ephemeral],
					})
					.catch(console.error);
			}
		} else if (subcommand === "type") {
			const type = interaction.options.getString("filter_type", true); // string of either "whitelist" or "blacklist"
			if (type !== "whitelist" && type !== "blacklist") return;
			if (channel && channel.type !== ChannelType.GuildVoice) {
				interaction
					.reply({
						content: `Filters are only available on voice channels`,
						flags: [MessageFlags.Ephemeral],
					})
					.catch(console.error);
				return; // stop the rest of function
			}

			const filter = await getFilter(currentUser.id, channel?.id ?? null);
			if (filterType(filter) === type) {
				interaction
					.reply({
						content: `${scopeNameCapitalized("filter")} is already a \`${type}\``,
						flags: [MessageFlags.Ephemeral],
					})
					.catch(console.error);
			} else {
				await setFilterType(
					currentUser.id,
					channel?.id ?? null,
					type === "whitelist",
				);
				interaction
					.reply({
						content: `${scopeNameCapitalized("filter")} was reset and changed to a \`${type}\``,
						flags: [MessageFlags.Ephemeral],
					})
					.catch(console.error);
			}
		} else if (subcommand === "reset") {
			const wasNotDefault = await resetFilter(
				currentUser.id,
				channel?.id ?? null,
			);
			interaction
				.reply({
					content: wasNotDefault
						? `${scopeNameCapitalized("filter")} has been reset and is now a blacklist`
						: `${scopeNameCapitalized("filter")} is already the default (blacklist with no users)`,
					flags: [MessageFlags.Ephemeral],
				})
				.catch(console.error);
		}
	},
};
