import { CommandName } from "@commands/commandNames";
import { Globals } from "@routes/types";

// a clickable command mention when the deployed id is known, else plain text
// (ids are fetched after the client is ready, so early interactions may miss them)
export const commandMention = (
	globals: Globals | undefined,
	name: CommandName,
): string => {
	const id = globals?.commandIds.get(name);
	return id ? `</${name}:${id}>` : `/${name}`;
};
