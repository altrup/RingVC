import { flashRedirect } from "@routes/lib/flash";
import { Handler } from "@routes/types";

import { getUserMode, setUserMode } from "@db/users";

import { isMode, MODES, PATH } from "./_shared";

export const modePost: Handler<"POST"> = async (router, interaction, state) => {
	const target = state.queryParams.get("set");
	if (!isMode(target))
		return flashRedirect(PATH, "Unknown mode, nothing changed", "warn");

	const current = await getUserMode(interaction.user.id);
	if (current === target)
		return flashRedirect(PATH, `Your mode is already ${target}`, "warn");

	await setUserMode(interaction.user.id, target);
	const effect = MODES.find(({ mode }) => mode === target)?.effect ?? "";
	return flashRedirect(PATH, `Mode set to ${target}. ${effect}`, "success");
};
