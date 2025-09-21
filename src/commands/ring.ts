import { ChatInputCommandInteraction, GuildMember, MessageFlags, SlashCommandBuilder } from "discord.js";

import { DiscordUser } from "@main/classes/commands/discord-user";
import { DataType } from "@main/data";

export const ring = {
	data: new SlashCommandBuilder()
		.setName('ring')
		.setDescription('Rings a user')
		.addUserOption(option => 
			option.setName('user')
				.setDescription('Select a user')
				.setRequired(true)),
	async execute(data: DataType, interaction: ChatInputCommandInteraction) {
		// command must be run in a guild
		if (!interaction.member) {
			interaction.reply({
				content: `This command must be run in a Discord server`,
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
			return;
		}

		const user = interaction.options.getUser('user', true);
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

		// NOTE: if discordUser is null, then we call the static ring method
		const discordUser = data.users.get(user.id);
		// send the user an invite link to the voice channel or text channel that the interaction creator is in
		Promise.allSettled([
			interaction.deferReply({ flags: [MessageFlags.Ephemeral] }),
			discordUser? discordUser.ring(channel, interaction.user, "wants you to join"):
				DiscordUser.ring(channel, interaction.user, "wants you to join", user.id)
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
					content: `Can't notify ${user} because ${results[1].reason}`,
				}).catch(console.error);
			}
		});
	},
};