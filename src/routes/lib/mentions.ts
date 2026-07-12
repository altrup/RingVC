import { Globals } from "@routes/types";

import { CommandName } from "@commands/commandNames";

// a clickable command mention when the deployed id is known, plain text
// otherwise (ids are fetched after the client is ready, so early
// interactions may miss them)
export const commandMention = (
	globals: Globals | undefined,
	name: CommandName,
): string => {
	const id = globals?.commandIds.get(name);
	return id ? `</${name}:${id}>` : `/${name}`;
};
