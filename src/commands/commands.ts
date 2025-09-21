import { ChatInputCommandInteraction, SharedSlashCommand } from "discord.js";

import { DataType } from "@main/data";

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
import { editFilter } from "@commands/filter/editFilter";
import { getFilter } from "@commands/filter/getFilter";
import { resetFilter } from "@commands/filter/resetFilter";

export type CommandImplementation = {
	data: SharedSlashCommand;
	execute: (data: DataType, interaction: ChatInputCommandInteraction) => Promise<void>;
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
	editFilter,
	getFilter,
	resetFilter,
];
