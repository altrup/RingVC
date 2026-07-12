import { homeButton, row } from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { Handler } from "@routes/types";
import { RouteButtonBuilder } from "discord-embed-router";
import { ButtonStyle, EmbedBuilder } from "discord.js";

import { getUserMode } from "@db/users";

import { MODES, PATH } from "./_shared";

const COLOR = "#F5853F";

export const modeGet: Handler<"GET"> = async (router, interaction, state) => {
	const current = await getUserMode(interaction.user.id);

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("Your mode")
				.setDescription(
					withFlash(
						state.queryParams,
						`Modes decide what happens when you join a voice channel. Your current mode is **${current}**.`,
					),
				)
				.addFields(
					MODES.map(({ label, effect }) => ({ name: label, value: effect })),
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
				homeButton(router),
			),
		],
	};
};
