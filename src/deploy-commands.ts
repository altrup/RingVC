import { REST, Routes } from 'discord.js';
import { DISCORD_CLIENT_ID, DISCORD_TOKEN } from '@config';
import { commands } from "@commands/commands";

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(DISCORD_TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(DISCORD_CLIENT_ID),
			{ body: commands.map(command => command.data.toJSON()) },
		);

		console.log(`Successfully reloaded ${(data as Array<unknown>).length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();
