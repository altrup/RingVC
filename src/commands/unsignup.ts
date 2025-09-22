import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';

import { DataType } from '@main/data';

export const unsignup = {
	data: new SlashCommandBuilder()
		.setName('unsignup')
		.setDescription('Stop being "rung" for a voice chat')
		.addChannelOption(option => 
			option.setName('channel')
				.setDescription('Select the channel to stop being "rung" for')
				.addChannelTypes(ChannelType.GuildVoice)
				.setRequired(false)),
	async execute(data: DataType, interaction: ChatInputCommandInteraction) {
		const channel = interaction.options.getChannel('channel')?? interaction.channel;
		const user = interaction.user;
		if (!channel || channel.type !== ChannelType.GuildVoice) {
			const moreInfo = new ButtonBuilder()
				.setLabel('Text Channels in Voice Channels')
				.setStyle(ButtonStyle.Link)
				.setURL('https://support.discord.com/hc/en-us/articles/4412085582359-Text-Channels-Text-Chat-In-Voice-Channels');
			interaction.reply({
				content: `Please select a channel, or run this command in the Voice Channel you want to un-sign up for`,
				flags: [MessageFlags.Ephemeral],
				components: [new ActionRowBuilder().addComponents(moreInfo).toJSON()]
			}).catch(console.error);
			return; // stop the rest of function
		}
		
		if (data.voiceChats.has(channel.id)) {
			const voiceChat = data.voiceChats.get(channel.id);
			if (voiceChat?.hasUser(user.id)) {
				voiceChat.removeUser(user.id);
				interaction.reply({
					content: `You will no longer be "rung" for <#${channel.id}>`,
					flags: [MessageFlags.Ephemeral]
				}).catch(console.error);
				return;
			}
		}
		interaction.reply({
			content: `You aren't signed up for <#${channel.id}>`,
			flags: [MessageFlags.Ephemeral]
		}).catch(console.error);
	},
};