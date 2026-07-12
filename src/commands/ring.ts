import {
	ActionRowBuilder,
	ChatInputCommandInteraction,
	ComponentType,
	GuildMember,
	MessageFlags,
	SlashCommandBuilder,
	UserSelectMenuBuilder,
} from "discord.js";

import { CommandName } from "@commands/commandNames";
import { DiscordUser } from "@main/classes/commands/discord-user";
import { VoiceChat } from "@main/classes/commands/voice-chat";
import { DataType } from "@main/data";

const ringUserSelectMenuBuilder = (disabled = false) => {
	return new ActionRowBuilder<UserSelectMenuBuilder>()
		.addComponents(
			new UserSelectMenuBuilder()
				.setPlaceholder("Select up to 25 users")
				.setMinValues(1)
				.setMaxValues(25)
				.setDisabled(disabled)
				.setCustomId("list-ring-users"),
		)
		.toJSON();
};

export const ring = {
	data: new SlashCommandBuilder()
		.setName("ring")
		.setDescription("Rings specified user(s)")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("user")
				.setDescription("Ring a user")
				.addUserOption((option) =>
					option
						.setName("user")
						.setDescription("Select a user")
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("users")
				.setDescription("Ring multiple users (select after running command)"),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("default")
				.setDescription("Ring all of your default ring recipients"),
		),
	async execute(
		data: DataType,
		interaction: ChatInputCommandInteraction,
		commandIds: Map<CommandName, string>,
	) {
		// command must be run in a guild
		if (!interaction.member) {
			interaction
				.reply({
					content: `This command must be run in a Discord server`,
					flags: [MessageFlags.Ephemeral],
				})
				.catch(console.error);
			return;
		}

		const channel = (interaction.member as GuildMember).voice.channel;
		// if channel doesn't exist (user not in call)
		if (!channel) {
			// don't send dm
			interaction
				.reply({
					content: `Please join a vc first`,
					flags: [MessageFlags.Ephemeral],
				})
				.catch(console.error);
			return;
		}

		if (interaction.options.getSubcommand() === "user") {
			const user = interaction.options.getUser("user", true);
			// send the user an invite link to the voice channel or text channel that the interaction creator is in
			const results = await Promise.allSettled([
				interaction.deferReply({ flags: [MessageFlags.Ephemeral] }),
				VoiceChat.ring(channel, interaction.user.id, "wants you to join", [
					user.id,
				]),
			]);

			// if deferReply failed, then there isn't a reply to edit
			if (results[0].status === "rejected") return;
			// otherwise, edit the reply to update about the ring
			if (results[1].status === "fulfilled") {
				const result = results[1].value[0];
				interaction
					.editReply({
						content:
							result?.status === "fulfilled"
								? `Notified ${user}`
								: `Can't ring ${DiscordUser.toString(user.id)}${result ? ` because ${result.error.message}` : ``}`,
					})
					.catch(console.error);
			} else {
				interaction
					.editReply({
						content: `Can't ring ${user} because ${results[1].reason.message}`,
					})
					.catch(console.error);
			}
		} else if (interaction.options.getSubcommand() === "users") {
			const response = await interaction.reply({
				content: `Select the users you want to ring`,
				components: [ringUserSelectMenuBuilder(false)],
				flags: [MessageFlags.Ephemeral],
			});

			const selection = await response
				.awaitMessageComponent({
					componentType: ComponentType.UserSelect,
					filter: (i) => i.user.id === interaction.user.id,
					time: 60_000,
				})
				.catch(() => null);

			if (!selection) {
				await interaction
					.editReply({
						content: `Timed out, no users were ringed`,
						components: [ringUserSelectMenuBuilder(true)],
					})
					.catch(console.error);
				return;
			}

			const results = await Promise.allSettled([
				selection.update({
					content: `Ringing users`,
				}),
				VoiceChat.ring(
					channel,
					interaction.user.id,
					"wants you to join",
					selection.values,
				),
			]);

			if (results[1].status === "fulfilled") {
				const ringedList = VoiceChat.joinWithAnd(
					results[1].value
						.filter((r) => r.status === "fulfilled")
						.map((r) => DiscordUser.toString(r.userId)),
				);
				selection
					.editReply({
						content: [
							...(ringedList.length > 0 ? [`Ringed ${ringedList}`] : []),
							...results[1].value
								.filter((r) => r.status === "rejected")
								.map(
									(r) =>
										`Can't ring ${DiscordUser.toString(r.userId)} because ${r.error.message}`,
								),
						].join("\n"),
						components: [ringUserSelectMenuBuilder(true)],
					})
					.catch(console.error);
			} else {
				selection
					.editReply({
						content: `Can't ring ${VoiceChat.joinWithAnd(selection.values.map((v) => DiscordUser.toString(v)))} because ${results[1].reason.message}`,
						components: [ringUserSelectMenuBuilder(true)],
					})
					.catch(console.error);
			}
		} else if (interaction.options.getSubcommand() === "default") {
			const discordUser = data.users.get(interaction.user.id);
			if (!discordUser) {
				interaction
					.reply({
						content: `You have no default ring recipients. Use </default_ring_recipients edit:${commandIds.get("default_ring_recipients")}> to add some`,
						flags: [MessageFlags.Ephemeral],
					})
					.catch(console.error);
				return;
			}

			// ring all default users
			Promise.allSettled([
				interaction.deferReply({ flags: [MessageFlags.Ephemeral] }),
				discordUser.ringDefaultUsers(channel, "wants you to join"),
			]).then((results) => {
				// if deferReply failed, then there isn't a reply to edit
				if (results[0].status === "rejected") return;
				// otherwise, edit the reply to update about the ring
				if (results[1].status === "fulfilled") {
					const ringedList = VoiceChat.joinWithAnd(
						results[1].value
							.filter((r) => r.status === "fulfilled")
							.map((r) => DiscordUser.toString(r.userId)),
					);
					interaction
						.editReply({
							content: [
								...(ringedList.length > 0 ? [`Ringed ${ringedList}`] : []),
								...results[1].value
									.filter((r) => r.status === "rejected")
									.map(
										(r) =>
											`Can't ring ${DiscordUser.toString(r.userId)} because ${r.error.message}`,
									),
							].join("\n"),
						})
						.catch(console.error);
				} else {
					interaction
						.editReply({
							content:
								`Can't ring default users because ${results[1].reason.message}` +
								([
									"no default users to ring",
									"no default users for whom you passed each other's filters",
								].includes(results[1].reason.message)
									? `. Use </default_ring_recipients edit:${commandIds.get("default_ring_recipients")}> to add some`
									: ""),
						})
						.catch(console.error);
				}
			});
		}
	},
};
