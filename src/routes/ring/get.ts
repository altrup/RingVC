import { navBar, row, subNav } from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { SELECT_MAX_VALUES } from "@routes/lib/paging";
import { Handler } from "@routes/types";
import {
	RouteButtonBuilder,
	RouteUserSelectMenuBuilder,
} from "discord-embed-router";
import { ActionRowBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

import { getAllDefaultRingees } from "@db/default-ringees";

import { noVoiceChannelFlash, PANEL, voiceChannelOf } from "./_shared";

const COLOR = "#c87a6d";

export const ringGet: Handler<"GET"> = async (router, interaction, state) => {
	// the Ring section's two sibling views; this panel is the "Ring now" one
	const ringViews = subNav(router, [
		{ label: "Quick ring", path: PANEL, active: true },
		{ label: "Default ringees", path: "/recipients/global" },
	]);

	const channel = voiceChannelOf(interaction);
	if (!channel)
		return {
			embeds: [
				new EmbedBuilder()
					.setColor(COLOR)
					.setTitle("📣 Quick ring")
					.setDescription(`⚠️ ${noVoiceChannelFlash(interaction)}`),
			],
			components: [
				ringViews,
				navBar(router, interaction, { active: "ringees" }),
			],
		};

	const defaults = await getAllDefaultRingees(interaction.user.id, channel.id);
	const description = withFlash(
		state.queryParams,
		`Ringing people in <#${channel.id}>.\n\n` +
			`**Your defaults** · ${defaults.length > 0 ? defaults.length : "None"}`,
	);

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("📣 Quick ring")
				.setDescription(description),
		],
		components: [
			new ActionRowBuilder<RouteUserSelectMenuBuilder>()
				.addComponents(
					new RouteUserSelectMenuBuilder(router)
						.setMinValues(1)
						.setMaxValues(SELECT_MAX_VALUES)
						.setPlaceholder("Select up to 25 people to ring")
						.setPattern(`${PANEL}/users`, { method: "POST" }),
				)
				.toJSON(),
			row(
				new RouteButtonBuilder(router)
					.setLabel("Ring defaults")
					.setStyle(ButtonStyle.Success)
					.setTo(`${PANEL}/default`, { method: "POST" }),
			),
			ringViews,
			navBar(router, interaction, { active: "ringees" }),
		],
	};
};
