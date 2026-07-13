import { navBar, row } from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { Handler } from "@routes/types";
import { RouteButtonBuilder } from "discord-embed-router";
import { ButtonStyle, EmbedBuilder } from "discord.js";

import { getUserMode } from "@db/users";

import { MODES, PATH } from "./_shared";

const COLOR = "#b28b45";

// compact one-line legend replacing a field per mode
const LEGEND =
	"-# **Normal**: rings everyone · **Stealth**: nobody · **Auto**: stealth while invisible";

export const modeGet: Handler<"GET"> = async (router, interaction, state) => {
	const current = await getUserMode(interaction.user.id);
	const currentLabel =
		MODES.find(({ mode }) => mode === current)?.label ?? current;

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("💤 Your mode")
				.setDescription(
					withFlash(
						state.queryParams,
						"Modes decide what happens when you join a voice channel.\n\n" +
							`**Current mode** · ${currentLabel}\n${LEGEND}`,
					),
				),
		],
		components: [
			row(
				...MODES.map(({ mode, label }) =>
					new RouteButtonBuilder(router)
						.setLabel(label)
						.setStyle(
							mode === current ? ButtonStyle.Primary : ButtonStyle.Secondary,
						)
						.setDisabled(mode === current)
						.setTo(PATH, { method: "POST", queryParams: { set: mode } }),
				),
			),
			navBar(router, interaction, "mode"),
		],
	};
};
