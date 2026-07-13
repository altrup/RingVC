import { row } from "@routes/lib/components";
import {
	buttonEmoji,
	emojiIconURL,
	RINGVC_EMOJI_ID,
	VC_EMOJI_ID,
} from "@routes/lib/emoji";
import { withFlash } from "@routes/lib/flash";
import { Handler } from "@routes/types";
import { RouteButtonBuilder } from "discord-embed-router";
import { ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

import { COLOR } from "./_shared";

const GITHUB_URL = "https://github.com/altrup/RingVC";
const SUPPORT_URL = "https://discord.gg/bxBePEnndq";

export const homeGet: Handler<"GET"> = (router, interaction, state) => {
	const vc = buttonEmoji(interaction, VC_EMOJI_ID);
	const brandIcon = emojiIconURL(interaction, RINGVC_EMOJI_ID);

	const embed = new EmbedBuilder()
		.setColor(COLOR)
		.setTitle("🔔 RingVC")
		.setDescription(
			withFlash(
				state.queryParams,
				"RingVC replicates group-chat voice calls in Discord servers: sign up for a voice channel and get pinged when someone starts a call there.\n\n" +
					"-# Everything the commands do lives in the panels below.",
			),
		);
	if (brandIcon) embed.setAuthor({ name: "RingVC", iconURL: brandIcon });

	// the Signups button carries the branded voice-channel emoji when it
	// resolves, falling back to a unicode bell otherwise
	const signups = new RouteButtonBuilder(router)
		.setStyle(ButtonStyle.Secondary)
		.setTo("/signups");
	if (vc) signups.setEmoji(vc).setLabel("Signups");
	else signups.setLabel("🔔 Signups");

	return {
		embeds: [embed],
		components: [
			row(
				signups,
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
			),
			row(
				new RouteButtonBuilder(router)
					.setLabel("📖 Commands")
					.setStyle(ButtonStyle.Secondary)
					.setTo("/commands"),
				new RouteButtonBuilder(router)
					.setLabel("🗑️ Delete data")
					.setStyle(ButtonStyle.Danger)
					.setTo("/delete-data"),
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
