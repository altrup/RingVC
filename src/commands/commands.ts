import { RingRouter } from "@routes/types";
import { ChatInputCommandInteraction, SharedSlashCommand } from "discord.js";

import { catalog } from "@commands/catalog";
import { defaultRingRecipients } from "@commands/defaultRingRecipient";
import { deleteData } from "@commands/deleteData";
import { block } from "@commands/filter/block";
import { filter } from "@commands/filter/filter";
import { unblock } from "@commands/filter/unblock";
import { unwhitelist } from "@commands/filter/unwhitelist";
import { whitelist } from "@commands/filter/whitelist";
import { help } from "@commands/help";
import { mode } from "@commands/mode";
import { quit } from "@commands/quit";
import { ring } from "@commands/ring";
import { ringDefaults } from "@commands/ringDefaults";
import { signup } from "@commands/signup";
import { signuprole } from "@commands/signuprole";
import { unsignup } from "@commands/unsignup";
import { unsignuprole } from "@commands/unsignuprole";

// commands are thin adapters: they parse their options and dispatch into
// the router, where all business rules live
export type CommandImplementation = {
	data: SharedSlashCommand;
	execute: (
		router: RingRouter,
		interaction: ChatInputCommandInteraction,
	) => Promise<void>;
};

export const commands: CommandImplementation[] = [
	help,
	catalog,
	deleteData,
	ring,
	ringDefaults,
	signup,
	unsignup,
	signuprole,
	unsignuprole,
	quit,
	mode,
	// filter commands
	block,
	unblock,
	whitelist,
	unwhitelist,
	filter,
	// default ring recipients
	defaultRingRecipients,
];
