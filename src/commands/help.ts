import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, MessageFlags } from 'discord.js';

import { DataType } from "@main/data";
import { CommandName } from '@commands/commandNames';

export const help = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Getting started'),
	async execute(data: DataType, interaction: ChatInputCommandInteraction, commandIds: Map<CommandName, string>) {
		interaction.reply({ 
			embeds: [
				new EmbedBuilder()
				.setColor('#b574c5')
				.setTitle('Getting Started')
				.setDescription('RingVC is a bot which tries to replicate Group Chat Voice Calls in Discord Servers')
				.addFields(
					{ name: 'Signing up', value: `Use </signup:${commandIds.get("signup")}> to start being rung when someone "starts" a call in the specified voice channel` },
					{ name: 'Role signups', value: `Admins can use </signuprole:${commandIds.get("signuprole")}> to sign up an entire role for a voice channel. When someone joins, the role gets pinged. Use </unsignuprole:${commandIds.get("unsignuprole")}> to remove a role. *Individual signups won't double-ping users who have a signed-up role*` },
					{ name: 'Quitting', value: `Use </quit:${commandIds.get("quit")}> or </unsignup:${commandIds.get("unsignup")}> to stop being rung for a voice channel` },
					{ name: 'Ringing', value: `What the bot was named after. Use </ring user:${commandIds.get("ring")}> to ping someone to join once you're in a voice channel` },
					{ name: 'Blocking people', value: `Don't want to be rung by someone? Use </block:${commandIds.get("block")}> to block people, and </unblock:${commandIds.get("unblock")}> to unblock them. *This means you won't be pinged if they "start" a voice call, however, once an unblocked person joins, you will be pinged*` },
					{ name: 'Modes', value: `Allows you to not ping people when joining a voice channel. Use </mode help:${commandIds.get("mode")}> for more info` },
					{ name: 'Auto and Default Ringing', value: `To configure your default ring recipients and auto ring, see </default_ring_recipients help:${commandIds.get("default_ring_recipients")}>` },
					{ name: 'Other commands', value: `Other than the basics above, see </filter help:${commandIds.get("filter")}> to manage your filters more in depth`},
					{ name: 'Support Server', value: `If something isn't working for you, or you'd like to suggest some new features, feel free to join the support server linked below! Or just say hello :)` },
					{ name: 'Github', value: `Check out the github linked below if you want to host your own version of this bot, or just view the code` }
				)
			],
			components: [
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
					.setLabel('Github')
					.setStyle(ButtonStyle.Link)
					.setURL('https://github.com/altrup/RingVC')
				).addComponents(
					new ButtonBuilder()
					.setLabel('Support Server')
					.setStyle(ButtonStyle.Link)
					.setURL('https://discord.gg/bxBePEnndq')
				).toJSON()
			],
			flags: [MessageFlags.Ephemeral] 
		}).catch(console.error);
	},
};