import {
	ChatInputCommandInteraction,
	ContextMenuCommandBuilder,
	SharedSlashCommand,
	UserContextMenuCommandInteraction,
} from "discord.js";

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

export type ContextMenuImplementation = {
	data: ContextMenuCommandBuilder;
	execute: (
		router: RingRouter,
		interaction: UserContextMenuCommandInteraction,
	) => Promise<void>;
};
