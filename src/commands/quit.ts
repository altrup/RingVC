// literally the same as signup.js but with a different name
import { ChannelType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { DataType } from "@main/data";
import { unsignup } from "@commands/unsignup";

export const quit = {
	data: new SlashCommandBuilder()
		.setName('quit')
		.setDescription('Stop being "rung" for a voice chat')
		.addChannelOption(option => 
			option.setName('channel')
				.setDescription('Select the call to stop being "rung" for, or type command in voice channel')
				.addChannelTypes(ChannelType.GuildVoice)
				.setRequired(false)),
	async execute(data: DataType, interaction: ChatInputCommandInteraction) {
		unsignup.execute(data, interaction);
	},
};