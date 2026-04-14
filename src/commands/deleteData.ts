// literally the same as signup.js but with a different name
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";

import { DataType } from "@main/data";

export const deleteData = {
	data: new SlashCommandBuilder()
		.setName('delete_data')
		.setDescription('Delete all your data stored for this bot'),
	async execute(data: DataType, interaction: ChatInputCommandInteraction) {
		// kind of an expensive operation, since the channels users are signed up for
		// are stored only in voiceChat class, not discordUser. might be worth changing later 

		const response = await interaction.reply({
			embeds: [
				new EmbedBuilder()
				.setColor('#ca2b2b')
				.setTitle('Delete all Data')
				.setDescription('Are you sure you want to delete all your data? This will remove all your filters, signups, and other account settings. This is irreversible')
			],
			components: [
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
					.setLabel('Delete')
					.setStyle(ButtonStyle.Danger)
					.setCustomId('confirm-delete-data')
				).addComponents(
					new ButtonBuilder()
					.setLabel('Cancel')
					.setStyle(ButtonStyle.Secondary)
					.setCustomId('cancel-delete-data')
				).toJSON()
			],
			flags: [MessageFlags.Ephemeral] 
		});

		const confirmation = await response.awaitMessageComponent({
			filter: (i) => i.user.id === interaction.user.id,
			time: 60_000 
		}).catch(() => ({ customId: 'cancel-delete-data', update: interaction.editReply.bind(interaction) }));
		
		let hadUserData = false; // check if there even was any user data to begin with
		if (confirmation.customId === 'confirm-delete-data') {
			// delete user
			if (data.users.delete(interaction.user.id)) hadUserData = true;

			// find all voice channels that user has signed up for
			data.voiceChats.forEach((voiceChat) => {
				if (voiceChat.removeUser(interaction.user.id)) hadUserData = true;
			});
		}

		await confirmation.update({
			embeds: [
				new EmbedBuilder()
				.setColor('#ca2b2b')
				.setTitle('Delete all Data')
				.setDescription('Are you sure you want to delete all your data? This will remove all your filters, signups, and other account settings. This is irreversible.')
			],
			components: [
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
					.setLabel(confirmation.customId === 'confirm-delete-data' ? (hadUserData ? 'Deleted Data' : 'No Data to Delete') : 'Delete')
					.setDisabled(true)
					.setStyle(ButtonStyle.Danger)
					.setCustomId('confirm-delete-data')
				).addComponents(
					new ButtonBuilder()
					.setLabel(confirmation.customId === 'confirm-delete-data' ? 'Cancel' : 'Cancelled')
					.setDisabled(true)
					.setStyle(ButtonStyle.Secondary)
					.setCustomId('cancel-delete-data')
				).toJSON()
			],
		});
	},
};