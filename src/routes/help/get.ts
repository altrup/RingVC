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
		"RingVC replicates group-chat calls in Discord servers. A server can't ring people the way a group chat does, so RingVC pings them in the voice channel's text chat instead.\n\n" +
			`**Ring** · ${mention("ring")} pings someone to join the voice channel you're in. Save default people and ping them with ${mention("ring_defaults")}, or turn on auto-ring to ping them automatically whenever you start a call.\n` +
			`**Sign up** · ${mention("signup")} in a voice channel's text chat signs you up, so you get pinged when someone starts a call there (joins it while it's empty). Manage several from the Signups panel.\n` +
			`**Role signups** · with Manage Roles, sign a whole role up for a channel via ${mention("signuprole")} so its members get pinged.\n` +
			`**Filters** · ${mention("block")} stops someone from ringing you, and ${mention("whitelist")} restricts ringing to only the people you list.\n` +
			`**Modes** · Normal pings your signed-up people when you start a call, Stealth pings no one, Auto goes stealth only while you're invisible. Set it with ${mention("mode")}.\n\n` +
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
