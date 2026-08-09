import { ringUser } from "@commands/context/ringUser";
import { about } from "@commands/slash/about";
import { catalog } from "@commands/slash/catalog";
import { defaultRingees } from "@commands/slash/defaultRingees";
import { defaultRingRecipients } from "@commands/slash/defaultRingRecipient";
import { deleteData } from "@commands/slash/deleteData";
import { block } from "@commands/slash/filter/block";
import { filter } from "@commands/slash/filter/filter";
import { unblock } from "@commands/slash/filter/unblock";
import { unwhitelist } from "@commands/slash/filter/unwhitelist";
import { whitelist } from "@commands/slash/filter/whitelist";
import { help } from "@commands/slash/help";
import { mode } from "@commands/slash/mode";
import { quit } from "@commands/slash/quit";
import { ring } from "@commands/slash/ring";
import { ringDefaults } from "@commands/slash/ringDefaults";
import { signup } from "@commands/slash/signup";
import { signuprole } from "@commands/slash/signuprole";
import { unsignup } from "@commands/slash/unsignup";
import { unsignuprole } from "@commands/slash/unsignuprole";
import {
	CommandImplementation,
	ContextMenuImplementation,
} from "@commands/types";

export const commands: CommandImplementation[] = [
	help,
	catalog,
	about,
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
	// default ringees
	defaultRingees,
	defaultRingRecipients,
];

export const contextMenuCommands: ContextMenuImplementation[] = [ringUser];
