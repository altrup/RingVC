import { RouteModalBuilder } from "discord-embed-router";
import {
	LabelBuilder,
	MessageFlags,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";

import { RingModal, RingRouter } from "@routes/types";

// typed-word confirmation for destructive actions: a button opens this modal
// with method MODAL, and the POST it targets verifies the input via confirmed()
export const confirmModal = (
	router: RingRouter,
	{ to, title, word }: { to: string; title: string; word: string },
): RingModal =>
	new RouteModalBuilder(router)
		.setTo(to, { method: "POST", flags: [MessageFlags.Ephemeral] })
		.setTitle(`⚠️ ${title}`)
		.addLabelComponents(
			new LabelBuilder()
				.setLabel(`Type ${word} to confirm`)
				.setDescription("This can't be undone.")
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId("confirm")
						.setStyle(TextInputStyle.Short)
						.setRequired(true)
						.setPlaceholder(word),
				),
		);

export const confirmed = (
	fields: { getTextInputValue(customId: string): string } | undefined,
	word: string,
) => (fields?.getTextInputValue("confirm") ?? "") === word;
