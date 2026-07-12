import { row } from "@routes/lib/components";
import { confirmed, confirmModal } from "@routes/lib/confirm";
import { flashRedirect, withFlash } from "@routes/lib/flash";
import { Handler, Handlers } from "@routes/types";
import { RouteButtonBuilder } from "discord-embed-router";
import { ButtonStyle, EmbedBuilder } from "discord.js";

import { deleteAllUserData } from "@db/users";

const COLOR = "#ca2b2b";
const PANEL = "/delete-data";
const CONFIRMATION = "DELETE";

const panelGet: Handler<"GET"> = (router, interaction, state) => {
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

const deleteConfirm: Handler<"MODAL"> = (router) =>
	confirmModal(router, {
		to: PANEL,
		title: "Delete all data",
		word: CONFIRMATION,
	});

const panelPost: Handler<"POST"> = async (router, interaction, state) => {
	if (!confirmed(state.fields, CONFIRMATION))
		return flashRedirect(
			PANEL,
			"Confirmation text did not match, nothing was deleted",
			"warn",
		);

	const hadData = await deleteAllUserData(interaction.user.id);
	return flashRedirect(
		PANEL,
		hadData
			? "All your data has been deleted"
			: "You had no stored data to delete",
		hadData ? "success" : "warn",
		{ done: "1" },
	);
};

export const deleteDataHandlers = {
	panel: { get: panelGet, post: panelPost } satisfies Handlers,
	confirm: { modal: deleteConfirm } satisfies Handlers,
};
