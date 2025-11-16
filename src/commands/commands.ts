import { ChatInputCommandInteraction, SharedSlashCommand } from "discord.js";

import { DataType } from "@main/data";
import { CommandName } from "@commands/commandNames";

import { help } from "@commands/help";
import { ring } from "@commands/ring";
import { signup } from "@commands/signup";
import { unsignup } from "@commands/unsignup";
import { quit } from "@commands/quit";
import { mode } from "@commands/mode";
import { block } from "@commands/filter/block";
import { unblock } from "@commands/filter/unblock";
import { whitelist } from "@commands/filter/whitelist";
import { unwhitelist } from "@commands/filter/unwhitelist";
import { filter } from "@commands/filter/filter";
import { defaultRingRecipients } from "@commands/defaultRingRecipient";

export type CommandImplementation = {
	data: SharedSlashCommand;
	execute: (data: DataType, interaction: ChatInputCommandInteraction, commandIds: Map<CommandName, string>) => Promise<void>;
};

export const commands: CommandImplementation[] = [
	help,
	ring,
	signup,
	unsignup,
	quit,
	mode,
	// filter commamnds
	block,
	unblock,
	whitelist,
	unwhitelist,
	filter,
	// default ring recipients
	defaultRingRecipients,
];
