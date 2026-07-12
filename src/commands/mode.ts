import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { CommandName } from "@commands/commandNames";
import { getUserMode, setUserMode } from "@db/users";

export const mode = {
	data: new SlashCommandBuilder()
		.setName("mode")
		.setDescription("Change modes between invis, normal, and auto")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("help")
				.setDescription("Prints some information about what the modes do"),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("set")
				.setDescription("Sets your mode")
				.addStringOption((option) =>
					option
						.setName("mode")
						.setDescription("Which mode to switch to")
						.addChoices(
							{ name: "Normal", value: "normal" },
							{ name: "Stealth", value: "stealth" },
							{ name: "Auto", value: "auto" },
						)
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName("get").setDescription("Displays your current mode"),
		),
	async execute(
		interaction: ChatInputCommandInteraction,
		commandIds: Map<CommandName, string>,
	) {
		// display help message
		if (interaction.options.getSubcommand() === "help") {
			interaction
				.reply({
					embeds: [
						new EmbedBuilder()
							.setColor("#F5853F")
							.setTitle("Mode Info")
							.setDescription(
								`Use </mode set:${commandIds.get("mode")}> to change your mode, and </mode get:${commandIds.get("mode")}> to see your current mode. \n Modes determine what happens when you join a voice channel`,
							)
							.addFields(
								{
									name: "Normal",
									value:
										"Joining a voice channel will ring all applicable users",
								},
								{
									name: "Stealth",
									value: "Joining a voice channel will not ring anyone",
								},
								{
									name: "Auto",
									value:
										"Sets mode to Stealth, if you are Invisible on Discord, and Normal otherwise",
								},
							),
					],
					flags: [MessageFlags.Ephemeral],
				})
				.catch(console.error);
		}
		// set mode
		else if (interaction.options.getSubcommand() === "set") {
			const mode = interaction.options.getString("mode", true);
			// the option choices only allow valid modes
			if (mode !== "normal" && mode !== "stealth" && mode !== "auto") return;

			await setUserMode(interaction.user.id, mode);
			interaction
				.reply({
					content: `Mode set to \`${mode}\`. ${
						mode === "auto"
							? "Your mode will automatically switch to stealth when you are invisible on Discord"
							: mode === "stealth"
								? "You will not ring anyone when you join a voice channel"
								: "You will ring all applicable users when you join a voice channel"
					}`,
					flags: [MessageFlags.Ephemeral],
				})
				.catch(console.error);
		}
		// get mode
		else if (interaction.options.getSubcommand() === "get") {
			const mode = await getUserMode(interaction.user.id);
			interaction
				.reply({
					content: `Your current mode is \`${mode}\`. ${
						mode === "auto"
							? "Your mode will automatically switch to stealth when you are invisible on Discord"
							: mode === "stealth"
								? "You will not ring anyone when you join a voice channel"
								: "You will ring all applicable users when you join a voice channel"
					}`,
					flags: [MessageFlags.Ephemeral],
				})
				.catch(console.error);
		}
	},
};
