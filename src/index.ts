// data is updated basically in every file
import { data } from "./main/data";
import * as fs from 'fs';
import * as path from 'path';
import { Client, Collection, GatewayIntentBits, MessageFlags, Partials } from 'discord.js';
import { DISCORD_TOKEN } from "./config";
import { commands as commandsArray } from "./commands/commands";

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildPresences,
	],
	partials: [Partials.Channel]
});

// load commands
const commands = new Collection<string, any>();
for (const command of commandsArray) {
	commands.set(command.data.name, command);
}

// When the client is ready, set status
client.once('clientReady', async () => {
	console.log('Ready');
	client.user?.setPresence({ activities: [{ name: '/help', type: 3 }], status: 'online' });
});
client.on('shardError', async () => {
	// console.log('disconnected');
});
client.on('shardReconnecting', async () => {
	// console.log('reconnecting');
});
client.on('shardResume', () => {
	// console.log('reconnected');
	client.user?.setPresence({ activities: [{ name: '/help', type: 3 }], status: 'online' });
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(data, interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', flags: [MessageFlags.Ephemeral] });
	}
});

client.on('voiceStateUpdate', (oldState, newState) => {
	// first condition is to check if user has joined a channel
	// second condition is to check if user is joining a new channel
	// third condition is to check if the channel has a voiceChat object
	try {
		if (newState?.channel && (!oldState || oldState.channelId !== newState.channelId) && data.voiceChats.has(newState.channelId?? ""))
			data.voiceChats.get(newState.channelId?? "")?.onJoin(newState.member?.user);
	}
	catch (error) {
		console.error(error);
	}
});

// wait until online to log in
// otherwise program will error out
import('is-online').then(({default: isOnline}) => {
    const check = async () => {
        console.log("Checking for internet...");
        if (await isOnline()) {
            console.log("Online. Connecting to server");
            client.login(DISCORD_TOKEN);
        } else {
            console.log("Offline. Checking again in 5 seconds");
            setTimeout(check, 5000);
        }
    };
    check();
});