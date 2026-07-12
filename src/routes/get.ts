import { row } from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { commandMention } from "@routes/lib/mentions";
import { Handler } from "@routes/types";
import { RouteButtonBuilder } from "discord-embed-router";
import { ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

import { CommandName } from "@commands/commandNames";

import { COLOR } from "./_shared";

const GITHUB_URL = "https://github.com/altrup/RingVC";
const SUPPORT_URL = "https://discord.gg/bxBePEnndq";

export const homeGet: Handler<"GET"> = (router, interaction, state) => {
	const mention = (name: CommandName) => commandMention(state.globals, name);

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("RingVC")
				.setDescription(
					withFlash(
						state.queryParams,
						"RingVC replicates group-chat voice calls in Discord servers: sign up for a voice channel and get pinged when someone starts a call there.",
					),
				)
				.addFields(
					{
						name: "Quick commands",
						value: `${mention("signup")} to get rung for a voice channel, ${mention("ring")} to ring people into yours, and ${mention("block")} to stop someone from ringing you.`,
					},
					{
						name: "Panels",
						value:
							"Everything the commands do can also be done from the panels below.",
					},
				),
		],
		components: [
			row(
				new RouteButtonBuilder(router)
					.setLabel("🔔 Signups")
					.setStyle(ButtonStyle.Primary)
					.setTo("/signups"),
				new RouteButtonBuilder(router)
					.setLabel("🛡️ Filter")
					.setStyle(ButtonStyle.Secondary)
					.setTo("/filter/global"),
				new RouteButtonBuilder(router)
					.setLabel("📣 Ring recipients")
					.setStyle(ButtonStyle.Secondary)
					.setTo("/recipients/global"),
				new RouteButtonBuilder(router)
					.setLabel("💤 Mode")
					.setStyle(ButtonStyle.Secondary)
					.setTo("/mode"),
				new RouteButtonBuilder(router)
					.setLabel("🗑️ Delete data")
					.setStyle(ButtonStyle.Danger)
					.setTo("/delete-data"),
			),
			row(
				new RouteButtonBuilder(router)
					.setLabel("📖 Commands")
					.setStyle(ButtonStyle.Secondary)
					.setTo("/commands"),
				new ButtonBuilder()
					.setLabel("Github")
					.setStyle(ButtonStyle.Link)
					.setURL(GITHUB_URL),
				new ButtonBuilder()
					.setLabel("Support Server")
					.setStyle(ButtonStyle.Link)
					.setURL(SUPPORT_URL),
			),
		],
	};
};
