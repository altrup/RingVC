import {
	ChatInputCommandInteraction,
	Client,
	Collection,
	GatewayIntentBits,
	MessageFlags,
	Partials,
} from "discord.js";

import { CommandName, isCommandName } from "@commands/commandNames";
import {
	CommandImplementation,
	commands as commandsArray,
} from "@commands/commands";
import { DISCORD_TOKEN } from "@config";
import { onVoiceChannelJoin } from "@main/ring";

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildPresences,
	],
	partials: [Partials.Channel],
});

// load commands
const commands = new Collection<string, CommandImplementation>();
for (const command of commandsArray) {
	commands.set(command.data.name, command);
}
const commandIds = new Map<CommandName, string>();

// When the client is ready, set status
client.once("clientReady", async () => {
	console.log("Ready");
	client.user?.setPresence({
		activities: [{ name: "/help", type: 3 }],
		status: "online",
	});

	(await client.application?.commands.fetch())?.forEach((command, key) => {
		if (isCommandName(command.name)) {
			commandIds.set(command.name, key);
		} else {
			console.error("Unknown command was registered: ", command.name);
		}
	});
});
client.on("shardError", async () => {
	// console.log('disconnected');
});
client.on("shardReconnecting", async () => {
	// console.log('reconnecting');
});
client.on("shardResume", () => {
	// console.log('reconnected');
	client.user?.setPresence({
		activities: [{ name: "/help", type: 3 }],
		status: "online",
	});
});

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;

	const command = commands.get(interaction.commandName);

	if (!command) return;

	try {
		if (interaction instanceof ChatInputCommandInteraction) {
			await command.execute(interaction, commandIds);
		}
	} catch (error) {
		console.error(error);
		await interaction
			.reply({
				content: "There was an error while executing this command!",
				flags: [MessageFlags.Ephemeral],
			})
			.catch(console.error);
	}
});

client.on("voiceStateUpdate", async (oldState, newState) => {
	// first condition is to check if user has joined a channel
	// second condition is to check if user is joining a new channel
	try {
		if (
			newState?.channel &&
			(!oldState || oldState.channelId !== newState.channelId) &&
			newState.member?.user
		) {
			await onVoiceChannelJoin(newState.channel, newState.member.user);
		}
	} catch (error) {
		// permission errors are expected here; log the rest
		console.error(error);
	}
});

// wait until online to log in
// otherwise program will error out
// NOTE: dynamic import is required here
import("is-online").then(({ default: isOnline }) => {
	const checkOnline = async () => {
		console.log("Checking for internet...");
		if (await isOnline()) {
			console.log("Online. Connecting to server");
			client.login(DISCORD_TOKEN);
		} else {
			console.log("Offline. Checking again in 5 seconds");
			setTimeout(checkOnline, 5000);
		}
	};
	checkOnline();
});
