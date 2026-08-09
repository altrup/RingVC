import { REST, Routes } from "discord.js";

import { commands, contextMenuCommands } from "@commands/index";
import { DISCORD_CLIENT_ID, DISCORD_TOKEN } from "@config";

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(DISCORD_TOKEN);

// and deploy your commands!
(async () => {
	try {
		const allCommands = [...commands, ...contextMenuCommands];
		console.log(
			`Started refreshing ${allCommands.length} application commands.`,
		);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), {
			body: allCommands.map((command) => command.data.toJSON()),
		});

		console.log(
			`Successfully reloaded ${(data as Array<unknown>).length} application commands.`,
		);
	} catch (error) {
		console.error(error);
	}
})();
