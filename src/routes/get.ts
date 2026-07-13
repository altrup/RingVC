import { navBar } from "@routes/lib/components";
import { emojiIconURL, RINGVC_EMOJI_ID } from "@routes/lib/emoji";
import { withFlash } from "@routes/lib/flash";
import { Handler } from "@routes/types";
import { EmbedBuilder } from "discord.js";

import { COLOR } from "./_shared";

export const homeGet: Handler<"GET"> = (router, interaction, state) => {
	// the branded author line (icon + "RingVC") is the panel's header, so
	// there is no separate title to duplicate it
	const embed = new EmbedBuilder()
		.setColor(COLOR)
		.setAuthor({ name: "RingVC", iconURL: emojiIconURL(RINGVC_EMOJI_ID) })
		.setDescription(
			withFlash(
				state.queryParams,
				"RingVC replicates group-chat voice calls in Discord servers: sign up for a voice channel and get pinged when someone starts a call there.",
			),
		);

	return {
		embeds: [embed],
		components: [
			navBar(router, interaction, {
				active: "home",
				path: "/",
				queryParams: state.queryParams,
			}),
		],
	};
};
