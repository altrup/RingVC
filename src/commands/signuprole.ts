import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction, GuildMember, MessageFlags, PermissionsBitField, SlashCommandBuilder } from 'discord.js';

import { DataType } from "@main/data";
import { VoiceChat } from '@main/classes/commands/voice-chat';
import { CommandName } from '@commands/commandNames';

export const signuprole = {
	data: new SlashCommandBuilder()
		.setName('signuprole')
		.setDescription('Sign up a role to get pinged when someone starts a call')
		.addRoleOption(option =>
			option.setName('role')
				.setDescription('Select the role to be pinged')
				.setRequired(true))
		.addChannelOption(option => 
			option.setName('channel')
				.setDescription('Select the channel for the role to be pinged in')
				.addChannelTypes(ChannelType.GuildVoice)
				.setRequired(false)),
	async execute(data: DataType, interaction: ChatInputCommandInteraction, commandIds: Map<CommandName, string>) {
		const channel = interaction.options.getChannel('channel') || interaction.channel;
		const role = interaction.options.getRole('role', true);
		const member = interaction.member as GuildMember;

		// Check permissions - user must have Manage Roles or be an admin
		if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles) && 
			!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
			interaction.reply({
				content: `You need the "Manage Roles" permission to sign up roles for voice channels`,
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
			return;
		}

		if (!channel || channel.type !== ChannelType.GuildVoice) {
			const moreInfo = new ButtonBuilder()
				.setLabel('Text Channels in Voice Channels')
				.setStyle(ButtonStyle.Link)
				.setURL('https://support.discord.com/hc/en-us/articles/4412085582359-Text-Channels-Text-Chat-In-Voice-Channels')
			interaction.reply({
				content: `Please select a channel, or run this command in the Voice Channel you want to sign up the role for`,
				flags: [MessageFlags.Ephemeral],
				components: [new ActionRowBuilder().addComponents(moreInfo).toJSON()]
			}).catch(console.error);
			return;
		}

		// update or create voice chat object
		if (data.voiceChats.has(channel.id)) {
			const voiceChat = data.voiceChats.get(channel.id);
			// if voice chat already has this role
			if (voiceChat?.hasRole(role.id)) {
				interaction.reply({
					content: `<@&${role.id}> is already signed up for <#${channel.id}>. Use </unsignuprole:${commandIds.get("unsignuprole")}> to remove it`,
					flags: [MessageFlags.Ephemeral]
				}).catch(console.error);
				return;
			}
			voiceChat?.addRole(role.id);
		}
		else {
			const voiceChat = new VoiceChat(channel.id);
			voiceChat.addRole(role.id);
		}
		
		interaction.reply({
			content: `Signed up <@&${role.id}> for <#${channel.id}>. Use </unsignuprole:${commandIds.get("unsignuprole")}> to remove it`,
			flags: [MessageFlags.Ephemeral]
		}).catch(console.error);
	},
};
