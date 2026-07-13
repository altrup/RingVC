import { homeButton, row } from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { commandMention } from "@routes/lib/mentions";
import { Handler } from "@routes/types";
import { EmbedBuilder } from "discord.js";

import { CommandName } from "@commands/commandNames";

import { COLOR } from "../_shared";

export const commandsGet: Handler<"GET"> = (router, interaction, state) => {
	const mention = (name: CommandName) => commandMention(state.globals, name);
	const quickActions: [CommandName, string][] = [
		["signup", "sign up for a voice channel (bare, in a VC's text chat)"],
		["unsignup", "remove a signup"],
		["quit", "same as /unsignup"],
		["signuprole", "sign up a role for a channel (Manage Roles)"],
		["unsignuprole", "remove a role signup (Manage Roles)"],
		["block", "block someone from ringing you"],
		["unblock", "unblock them"],
		["whitelist", "allow someone through your whitelist"],
		["unwhitelist", "remove them from your whitelist"],
		["ring", "ring someone into your voice channel (with a user)"],
	];
	const panels: [CommandName, string][] = [
		["help", "the home panel"],
		["catalog", "this command list"],
		["signup", "your signups panel (bare, outside a voice channel)"],
		["filter", "your filter panel"],
		["default_ring_recipients", "ring recipients and auto-ring panel"],
		["mode", "mode panel"],
		["ring", "ring panel (bare)"],
		["delete_data", "data deletion panel"],
	];
	const list = (entries: [CommandName, string][]) =>
		entries.map(([name, blurb]) => `${mention(name)}: ${blurb}`).join("\n");

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("Commands")
				.setDescription(
					withFlash(state.queryParams, "Every command is clickable."),
				)
				.addFields(
					{ name: "Quick actions", value: list(quickActions) },
					{ name: "Panel openers", value: list(panels) },
				),
		],
		components: [row(homeButton(router))],
	};
};
