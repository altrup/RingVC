import { navBar, row } from "@routes/lib/components";
import { emojiIconURL, RINGVC_EMOJI_ID } from "@routes/lib/emoji";
import { withFlash } from "@routes/lib/flash";
import { Handler } from "@routes/types";
import { RouteButtonBuilder } from "discord-embed-router";
import { ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

import { COLOR } from "./_shared";

const GITHUB_URL = "https://github.com/altrup/RingVC";
const SUPPORT_URL = "https://discord.gg/bxBePEnndq";

export const homeGet: Handler<"GET"> = (router, interaction, state) => {
	// the branded author line (icon + "RingVC") is the panel's header, so
	// there is no separate title to duplicate it
	const embed = new EmbedBuilder()
		.setColor(COLOR)
		.setAuthor({ name: "RingVC", iconURL: emojiIconURL(RINGVC_EMOJI_ID) })
		.setDescription(
			withFlash(
				state.queryParams,
				"RingVC replicates group-chat voice calls in Discord servers: sign up for a voice channel and get pinged when someone starts a call there.\n\n" +
					"-# Everything the commands do lives in the panels below.",
			),
		);

	return {
		embeds: [embed],
		components: [
			row(
				new RouteButtonBuilder(router)
					.setLabel("📖 Commands")
					.setStyle(ButtonStyle.Secondary)
					.setTo("/commands"),
				new RouteButtonBuilder(router)
					.setLabel("🗑️ Delete data")
					.setStyle(ButtonStyle.Danger)
					.setTo("/delete-data"),
			),
			row(
				new ButtonBuilder()
					.setLabel("Github")
					.setStyle(ButtonStyle.Link)
					.setURL(GITHUB_URL),
				new ButtonBuilder()
					.setLabel("Support Server")
					.setStyle(ButtonStyle.Link)
					.setURL(SUPPORT_URL),
			),
			// the section bar sits last, same as every other panel; on Home the
			// active tab is Home itself, rendered inert
			navBar(router, interaction, "home"),
		],
	};
};
