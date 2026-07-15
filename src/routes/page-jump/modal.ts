import { Handler } from "@routes/types";
import { RouteModalBuilder } from "discord-embed-router";
import { LabelBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

import { PAGE_JUMP } from "./_shared";

// opened by the "Page n of m" pagination button of any paged panel; the
// button carries the panel's path in `to` so one modal serves them all
export const pageJumpModal: Handler<"MODAL"> = (router, interaction, state) => {
	const query = state.queryParams;
	const pageCount = query.get("pageCount") ?? "";
	return new RouteModalBuilder(router)
		.setTo(PAGE_JUMP, {
			method: "POST",
			queryParams: {
				to: query.get("to") ?? "/",
				page: query.get("page") ?? "0",
			},
		})
		.setTitle("Go to page")
		.addLabelComponents(
			new LabelBuilder()
				.setLabel(`Page number (1–${pageCount})`)
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId("page")
						.setStyle(TextInputStyle.Short)
						.setRequired(true)
						.setPlaceholder(`1–${pageCount}`),
				),
		);
};
