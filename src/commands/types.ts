import { ChatInputCommandInteraction, SharedSlashCommand } from "discord.js";

import { RingRouter } from "@routes/types";

// commands are thin adapters: they parse their options and dispatch into
// the router, where all business rules live
export type CommandImplementation = {
	data: SharedSlashCommand;
	execute: (
		router: RingRouter,
		interaction: ChatInputCommandInteraction,
	) => Promise<void>;
};
