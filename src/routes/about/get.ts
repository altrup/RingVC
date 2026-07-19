import { ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

import { navBar, row } from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { Handler } from "@routes/types";

const COLOR = "#5865f2";

const GITHUB_URL = "https://github.com/altrup/RingVC";
const SUPPORT_URL = "https://discord.gg/bxBePEnndq";

export const aboutGet: Handler<"GET"> = (router, interaction, state) => {
	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("ℹ️ About")
				.setDescription(
					withFlash(
						state.queryParams,
						"RingVC is free and open source. Star it on GitHub, or join the support server for help and updates.",
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
			),
			navBar(router, interaction),
		],
	};
};
