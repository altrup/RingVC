export const commandNamesList = [
	"help",
	"ring",
	"signup",
	"unsignup",
	"quit",
	"mode",
	"block",
	"unblock",
	"whitelist",
	"unwhitelist",
	"filter",
	"default_ring_recipients",
] as const;
export type CommandName = typeof commandNamesList[number];

const commandNames = new Set<CommandName>(commandNamesList);
export const isCommandName = (commandName: string): commandName is CommandName => {
	return commandNames.has(commandName as CommandName);
};
