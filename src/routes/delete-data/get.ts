import { row } from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { Handler } from "@routes/types";
import { RouteButtonBuilder } from "discord-embed-router";
import { ButtonStyle, EmbedBuilder } from "discord.js";

import { PANEL } from "./_shared";

const COLOR = "#ca2b2b";

export const deleteDataGet: Handler<"GET"> = (router, interaction, state) => {
	// set by the deletion redirect: the panel has done its job, so its
	// buttons render disabled
	const done = state.queryParams.get("done") === "1";

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("Delete all data")
				.setDescription(
					withFlash(
						state.queryParams,
						"Are you sure you want to delete all your data? This will remove all your filters, signups, and other account settings. This is irreversible.",
					),
				),
		],
		components: [
			row(
				new RouteButtonBuilder(router)
					.setLabel("Delete")
					.setStyle(ButtonStyle.Danger)
					.setDisabled(done)
					.setTo(`${PANEL}/confirm`, { method: "MODAL" }),
				new RouteButtonBuilder(router)
					.setLabel("Cancel")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(done)
					.setTo("/"),
			),
		],
	};
};
