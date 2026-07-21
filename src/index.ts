import { EmbedRouter } from "discord-embed-router";
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
import {
	instrumentRouter,
	recordErrorOnce,
	recordInteractionUsage,
} from "@main/diagnostics";
import { onVoiceChannelJoin } from "@main/ring";
import { registerRoutes } from "@routes/index";
import { Globals } from "@routes/types";

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildPresences,
	],
	partials: [Partials.Channel],
});

// the router handles every component/modal interaction its builders created;
// commands dispatch into it explicitly below
const router = new EmbedRouter<Globals>(client, { name: "ringvc" });
router.onError((err, interaction) => {
	// handler errors are already reported under their route key; this catches
	// router-internal ones
	recordErrorOnce("ROUTER", err);
	console.error(err);
	if (
		interaction &&
		"reply" in interaction &&
		!interaction.replied &&
		!interaction.deferred
	) {
		interaction
			.reply({
				content: "Something went wrong handling that interaction",
				flags: [MessageFlags.Ephemeral],
			})
			.catch(console.error);
	}
});

const commandIds = new Map<CommandName, string>();
router.setGlobals({ commandIds });
instrumentRouter(router);
registerRoutes(router);

// load commands
const commands = new Collection<string, CommandImplementation>();
for (const command of commandsArray) {
	commands.set(command.data.name, command);
}

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
			recordInteractionUsage(
				`COMMAND /${interaction.commandName}`,
				interaction,
			);
			await command.execute(router, interaction);
		}
	} catch (error) {
		recordErrorOnce(`COMMAND /${interaction.commandName}`, error);
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
