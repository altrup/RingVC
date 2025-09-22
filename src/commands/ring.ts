import { ChatInputCommandInteraction, GuildMember, MessageFlags, SlashCommandBuilder } from "discord.js";

import { DiscordUser } from "@main/classes/commands/discord-user";
import { DataType } from "@main/data";

export const ring = {
	data: new SlashCommandBuilder()
		.setName('ring')
		.setDescription('Rings specified user(s)')
		.addSubcommand(subcommand => 
			subcommand.setName('user')
				.setDescription('Ring a user')
				.addUserOption(option => 
					option.setName('user')
						.setDescription('Select a user')
						.setRequired(true)))
		.addSubcommand(subcommand => 
			subcommand.setName('default')
				.setDescription('Ring all of your default ring recipients')),
	async execute(data: DataType, interaction: ChatInputCommandInteraction) {
		// command must be run in a guild
		if (!interaction.member) {
			interaction.reply({
				content: `This command must be run in a Discord server`,
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
			return;
		}

		const channel = (interaction.member as GuildMember).voice.channel;
		// if channel doesn't exist (user not in call)
		if (!channel) {
			// don't send dm
			interaction.reply({
				content: `Please join a vc first`,
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
			return;
		}

		if (interaction.options.getSubcommand() === "user") {
			const user = interaction.options.getUser('user', true);
			// send the user an invite link to the voice channel or text channel that the interaction creator is in
			Promise.allSettled([
				interaction.deferReply({ flags: [MessageFlags.Ephemeral] }),
				DiscordUser.ring(channel, interaction.user.id, "wants you to join", user.id)
			]).then((results) => {
				// if deferReply failed, then there isn't a reply to edit
				if (results[0].status === "rejected") return;
				// otherwise, edit the reply to update about the ring
				if (results[1].status === "fulfilled") {
					interaction.editReply({
						content: `Notified ${user}`,
					}).catch(console.error);
				}
				else {
					interaction.editReply({
						content: `Can't notify ${user} because ${results[1].reason.message}`,
					}).catch(console.error);
				}
			});
		} else if (interaction.options.getSubcommand() === "default") {
			const discordUser = data.users.get(interaction.user.id);
			if (!discordUser) {
				interaction.reply({
					content: `You have no default ring recipients. Use \`/default_ring_recipients add\` to add some`,
					flags: [MessageFlags.Ephemeral]
				}).catch(console.error);
				return;
			}

			// ring all default users
			Promise.allSettled([
				interaction.deferReply({ flags: [MessageFlags.Ephemeral] }),
				discordUser.ringDefaultUsers(channel, "wants you to join")
			]).then((results) => {
				// if deferReply failed, then there isn't a reply to edit
				if (results[0].status === "rejected") return;
				// otherwise, edit the reply to update about the ring
				if (results[1].status === "fulfilled") {
					interaction.editReply({
						content: `Notified all default users`,
					}).catch(console.error);
				} else {
					interaction.editReply({
						content: `Can't notify default users because ${results[1].reason.message}`,
					}).catch(console.error);
				}
			});
		}
	},
};