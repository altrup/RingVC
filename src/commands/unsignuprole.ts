import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction, GuildMember, MessageFlags, PermissionsBitField, SlashCommandBuilder } from 'discord.js';

import { DataType } from '@main/data';
import { CommandName } from '@commands/commandNames';

export const unsignuprole = {
	data: new SlashCommandBuilder()
		.setName('unsignuprole')
		.setDescription('Stop a role from being pinged for a voice chat')
		.addRoleOption(option =>
			option.setName('role')
				.setDescription('Select the role to remove')
				.setRequired(true))
		.addChannelOption(option => 
			option.setName('channel')
				.setDescription('Select the channel to remove the role from')
				.addChannelTypes(ChannelType.GuildVoice)
				.setRequired(false)),
	async execute(data: DataType, interaction: ChatInputCommandInteraction, commandIds: Map<CommandName, string>) {
		const channel = interaction.options.getChannel('channel') ?? interaction.channel;
		const role = interaction.options.getRole('role', true);
		const member = interaction.member as GuildMember;

		// Check permissions - user must have Manage Roles or be an admin
		if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles) && 
			!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
			interaction.reply({
				content: `You need the "Manage Roles" permission to remove roles from voice channels`,
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
			return;
		}

		if (!channel || channel.type !== ChannelType.GuildVoice) {
			const moreInfo = new ButtonBuilder()
				.setLabel('Text Channels in Voice Channels')
				.setStyle(ButtonStyle.Link)
				.setURL('https://support.discord.com/hc/en-us/articles/4412085582359-Text-Channels-Text-Chat-In-Voice-Channels');
			interaction.reply({
				content: `Please select a channel, or run this command in the Voice Channel you want to remove the role from`,
				flags: [MessageFlags.Ephemeral],
				components: [new ActionRowBuilder().addComponents(moreInfo).toJSON()]
			}).catch(console.error);
			return;
		}
		
		if (data.voiceChats.has(channel.id)) {
			const voiceChat = data.voiceChats.get(channel.id);
			if (voiceChat?.hasRole(role.id)) {
				voiceChat.removeRole(role.id);
				interaction.reply({
					content: `<@&${role.id}> will no longer be pinged for <#${channel.id}>`,
					flags: [MessageFlags.Ephemeral]
				}).catch(console.error);
				return;
			}
		}
		interaction.reply({
			content: `<@&${role.id}> isn't signed up for <#${channel.id}>`,
			flags: [MessageFlags.Ephemeral]
		}).catch(console.error);
	},
};
