import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { CommandName } from "@commands/commandNames";
import { addVoiceChatUser } from "@db/voice-chats";

export const signup = {
	data: new SlashCommandBuilder()
		.setName("signup")
		.setDescription('Sign up to get "rung" when someone starts a call')
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription('Select the channel to be "rung" for')
				.addChannelTypes(ChannelType.GuildVoice)
				.setRequired(false),
		),
	async execute(
		interaction: ChatInputCommandInteraction,
		commandIds: Map<CommandName, string>,
	) {
		const channel =
			interaction.options.getChannel("channel") || interaction.channel;
		const user = interaction.user;
		if (!channel || channel.type !== ChannelType.GuildVoice) {
			const moreInfo = new ButtonBuilder()
				.setLabel("Text Channels in Voice Channels")
				.setStyle(ButtonStyle.Link)
				.setURL(
					"https://support.discord.com/hc/en-us/articles/4412085582359-Text-Channels-Text-Chat-In-Voice-Channels",
				);
			interaction
				.reply({
					content: `Please select a channel, or run this command in the Voice Channel you want to sign up for`,
					flags: [MessageFlags.Ephemeral],
					components: [new ActionRowBuilder().addComponents(moreInfo).toJSON()],
				})
				.catch(console.error);
			return; // stop the rest of function
		}

		const added = await addVoiceChatUser(channel.id, user.id);
		if (!added) {
			interaction
				.reply({
					content: `You are already signed up for <#${channel.id}>. Use </unsignup:${commandIds.get("unsignup")}> to unsignup`,
					flags: [MessageFlags.Ephemeral],
				})
				.catch(console.error);
			return; // stops the rest of the function
		}

		interaction
			.reply({
				content: `Signed up for <#${channel.id}>. Use </unsignup:${commandIds.get("unsignup")}> to unsignup`,
				flags: [MessageFlags.Ephemeral],
			})
			.catch(console.error);
	},
};
