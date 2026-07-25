import { RouteButtonBuilder } from "discord-embed-router";
import { ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

import { navBar, row } from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { Handler } from "@routes/types";

import { FEEDBACK } from "./_shared";

const COLOR = "#5865f2";

const GITHUB_URL = "https://github.com/altrup/RingVC";
const SUPPORT_URL = "https://discord.gg/bxBePEnndq";
const PRIVACY_URL = "https://github.com/altrup/RingVC/blob/main/Privacy.md";
const TERMS_URL =
	"https://github.com/altrup/RingVC/blob/main/TermsAndConditions.md";

export const aboutGet: Handler<"GET"> = (router, interaction, state) => {
	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("ℹ️ About")
				.setDescription(
					withFlash(
						state.queryParams,
						"RingVC replicates group-chat voice calls in Discord servers: sign up for a voice channel and get pinged when someone starts a call there.\n\nIt's free and open source. Star it on GitHub, or join the support server for help and updates.\n\nHave a bug report or feature idea? Give anonymous feedback below.",
					),
				),
		],
		components: [
			row(
				new ButtonBuilder()
					.setLabel("Github")
					.setStyle(ButtonStyle.Link)
					.setURL(GITHUB_URL),
				new ButtonBuilder()
					.setLabel("Support Server")
					.setStyle(ButtonStyle.Link)
					.setURL(SUPPORT_URL),
				new RouteButtonBuilder(router)
					.setLabel("Give feedback")
					.setStyle(ButtonStyle.Primary)
					.setTo(FEEDBACK, { method: "MODAL" }),
			),
			row(
				new ButtonBuilder()
					.setLabel("Privacy Policy")
					.setStyle(ButtonStyle.Link)
					.setURL(PRIVACY_URL),
				new ButtonBuilder()
					.setLabel("Terms & Conditions")
					.setStyle(ButtonStyle.Link)
					.setURL(TERMS_URL),
			),
			navBar(router, interaction),
		],
	};
};
