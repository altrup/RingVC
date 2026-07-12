import {
	RouteButtonBuilder,
	RouteModalBuilder,
} from "discord-embed-router";
import {
	ButtonStyle,
	EmbedBuilder,
	LabelBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";

import { deleteAllUserData } from "@db/users";
import { row } from "@routes/lib/components";
import { flashRedirect, withFlash } from "@routes/lib/flash";
import { Handler, Handlers } from "@routes/types";

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

const confirmModal: Handler<"MODAL"> = (router) =>
	new RouteModalBuilder(router)
		.setTo(PANEL, { method: "POST" })
		.setTitle("Delete all data")
		.addLabelComponents(
			new LabelBuilder()
				.setLabel(`Type ${CONFIRMATION} to confirm`)
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId("confirm")
						.setStyle(TextInputStyle.Short)
						.setRequired(true)
						.setPlaceholder(CONFIRMATION),
				),
		);

const panelPost: Handler<"POST"> = async (router, interaction, state) => {
	const confirmation = state.fields?.getTextInputValue("confirm") ?? "";
	if (confirmation !== CONFIRMATION)
		return flashRedirect(
			PANEL,
			"Confirmation text did not match, nothing was deleted",
			"warn",
		);

	const hadData = await deleteAllUserData(interaction.user.id);
	return flashRedirect(
		PANEL,
		hadData ? "All your data has been deleted" : "You had no stored data to delete",
		hadData ? "success" : "warn",
		{ done: "1" },
	);
};

export const deleteDataHandlers = {
	panel: { get: panelGet, post: panelPost } satisfies Handlers,
	confirm: { modal: confirmModal } satisfies Handlers,
};
