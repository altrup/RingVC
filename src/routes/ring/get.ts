import { homeButton, navBar, row } from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { PAGE_SIZE } from "@routes/lib/paging";
import { Handler } from "@routes/types";
import {
	RouteButtonBuilder,
	RouteUserSelectMenuBuilder,
} from "discord-embed-router";
import { ActionRowBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

import { getAllDefaultRingees } from "@db/default-ringees";
import { joinWithAnd, mentionUser } from "@main/ring";

import { NOT_IN_VC, PANEL, voiceChannelOf } from "./_shared";

const COLOR = "#c87a6d";

export const ringGet: Handler<"GET"> = async (router, interaction, state) => {
	const channel = voiceChannelOf(interaction);
	if (!channel)
		return {
			embeds: [
				new EmbedBuilder()
					.setColor(COLOR)
					.setTitle("Ring")
					.setDescription(`⚠️ ${NOT_IN_VC}`),
			],
			components: [row(homeButton(router))],
		};

	const defaults = await getAllDefaultRingees(interaction.user.id, channel.id);
	const description = withFlash(
		state.queryParams,
		`Ringing people into <#${channel.id}>.\n\n` +
			`**Your defaults here** · ${defaults.length > 0 ? joinWithAnd(defaults.map(mentionUser)) : "None"}`,
	);

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("📣 Ring")
				.setDescription(description),
		],
		components: [
			new ActionRowBuilder<RouteUserSelectMenuBuilder>()
				.addComponents(
					new RouteUserSelectMenuBuilder(router)
						.setMinValues(1)
						.setMaxValues(PAGE_SIZE)
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
			navBar(router, interaction, {
				path: PANEL,
				queryParams: state.queryParams,
			}),
		],
	};
};
