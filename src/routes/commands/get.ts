import { navBar } from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { commandMention } from "@routes/lib/mentions";
import { Handler } from "@routes/types";
import { EmbedBuilder } from "discord.js";

import { CommandName } from "@commands/commandNames";

const COLOR = "#6197cd";

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
		["ring_defaults", "ring your saved defaults into your voice channel"],
	];
	const panels: [CommandName, string][] = [
		["ringvc", "the home panel"],
		["help", "this help page"],
		["signup", "your signups panel (bare, outside a voice channel)"],
		["filter", "your filter panel"],
		["default_ring_recipients", "ring recipients and auto-ring panel"],
		["mode", "mode panel"],
		["ring", "ring panel (bare)"],
		["delete_data", "data deletion panel"],
	];
	const list = (entries: [CommandName, string][]) =>
		entries.map(([name, blurb]) => `${mention(name)} · ${blurb}`).join("\n");

	const description = withFlash(
		state.queryParams,
		"Sign up for a voice channel to get pinged when someone starts a call " +
			"there. Run a command below, or use the section menu to open any panel." +
			`\n\n**Quick actions**\n${list(quickActions)}\n\n` +
			`**Panel openers**\n${list(panels)}`,
	);

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("📖 Commands")
				.setDescription(description),
		],
		components: [navBar(router, interaction, { active: "commands" })],
	};
};
