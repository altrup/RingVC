import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';

import { DataType } from '@main/data';
import { DiscordUser } from '@main/classes/commands/discord-user';

export const mode = {
	data: new SlashCommandBuilder()
		.setName('mode')
		.setDescription('Change modes between invis, normal, and auto')
		.addSubcommand(subcommand =>
			subcommand.setName("help")
			.setDescription("Prints some information about what the modes do"))
		.addSubcommand(subcommand => 
			subcommand.setName("set")
			.setDescription("Sets your mode")
			.addStringOption(option =>
				option.setName("mode")
					.setDescription("Which mode to switch to")
					.addChoices(
						{name: "Normal", value: "normal"},
						{name: "Stealth", value: "stealth"},
						{name: "Auto", value: "auto"}
					)
					.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand.setName("get")
			.setDescription("Displays your current mode")),
	async execute(data: DataType, interaction: ChatInputCommandInteraction) {
		// display help message
		if (interaction.options.getSubcommand() === "help") {
			interaction.reply({
				embeds: [
					new EmbedBuilder()
					.setColor('#F5853F')
					.setTitle('Mode Info')
					.setDescription('Use /mode set to change your mode, and /mode get to see your current mode. \n Modes determine what happens when you join a voice channel')
					.addFields(
						{ name: 'Normal', value: 'Joining a voice channel will ring all applicable users' },
						{ name: 'Stealth', value: 'Joining a voice channel will not ring anyone' },
						{ name: 'Auto', value: 'Sets mode to Stealth, if you are Invisible on Discord, and Normal otherwise' }
					)
				], 
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
		}
		// set mode
		else if (interaction.options.getSubcommand() === "set") {
			const user = interaction.user;
			const discordUser = data.users.get(user.id)?? new DiscordUser(user.id);

			const mode = interaction.options.getString("mode");
			discordUser.setMode(mode);
			interaction.reply({
				content: `Mode set to \`${mode}\`. ${
					(mode === "auto")? "Your mode will automatically switch to stealth when you are invisible on Discord": 
					(mode === "stealth")? "You will not ring anyone when you join a voice channel":
					"You will ring all applicable users when you join a voice channel"
				}`,
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
		}
		// get mode
		else if (interaction.options.getSubcommand() === "get") {
			const user = interaction.user;
			const discordUser = data.users.get(user.id);

			const mode = discordUser? discordUser.getMode(): "normal";
			interaction.reply({
				content: `Your current mode is \`${mode}\`. ${
					(mode === "auto")? "Your mode will automatically switch to stealth when you are invisible on Discord": 
					(mode === "stealth")? "You will not ring anyone when you join a voice channel":
					"You will ring all applicable users when you join a voice channel"
				}`,
				flags: [MessageFlags.Ephemeral]
			}).catch(console.error);
		}
	},
};