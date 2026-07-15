import { navBar } from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { commandMention } from "@routes/lib/mentions";
import { Handler } from "@routes/types";
import { EmbedBuilder } from "discord.js";

import { CommandName } from "@commands/commandNames";

import { COLOR, helpSubNav } from "./_shared";

export const helpGet: Handler<"GET"> = (router, interaction, state) => {
	const mention = (name: CommandName) => commandMention(state.globals, name);

	const description = withFlash(
		state.queryParams,
		"RingVC replicates group-chat voice calls in Discord servers: sign up for a voice channel and get pinged when someone starts a call there.\n\n" +
			`**Sign up** · ${mention("signup")} in a voice channel's text chat, or open the Signups panel to manage several at once.\n` +
			`**Role signups** · with Manage Roles, sign a whole role up for a channel via ${mention("signuprole")} or the Role signups view.\n` +
			`**Ring people in** · ${mention("ring")} pulls someone into your call; save defaults for ${mention("ring_defaults")}, or turn on auto-ring to ping them on every join.\n` +
			`**Filters** · ${mention("block")} and ${mention("whitelist")} control who can ring you.\n` +
			`**Modes** · Normal rings everyone, Stealth rings nobody, Auto goes stealth while you're invisible — set it with ${mention("mode")}.\n\n` +
			"-# Full command list on the Catalog tab. Jump to any panel with the section menu below.",
	);

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("📖 Getting started")
				.setDescription(description),
		],
		components: [
			helpSubNav(router, "help"),
			navBar(router, interaction, { active: "help" }),
		],
	};
};
