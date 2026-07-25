import { RouteModalBuilder } from "discord-embed-router";
import { LabelBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

import { Handler } from "@routes/types";

import { FEEDBACK } from "../_shared";

export const aboutFeedbackModal: Handler<"MODAL"> = (router) =>
	new RouteModalBuilder(router)
		.setTo(FEEDBACK, { method: "POST" })
		.setTitle("Give feedback")
		.addLabelComponents(
			new LabelBuilder()
				.setLabel("Your feedback")
				.setDescription("Submissions are anonymous.")
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId("content")
						.setStyle(TextInputStyle.Paragraph)
						.setRequired(true)
						.setPlaceholder("Bug reports, feature ideas, anything"),
				),
		);
