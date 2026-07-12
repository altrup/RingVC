import { homeButton, row } from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { commandMention } from "@routes/lib/mentions";
import { Handler, Handlers } from "@routes/types";
import { RouteButtonBuilder } from "discord-embed-router";
import { ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

import { CommandName } from "@commands/commandNames";

const COLOR = "#b574c5";
const GITHUB_URL = "https://github.com/altrup/RingVC";
const SUPPORT_URL = "https://discord.gg/bxBePEnndq";

const panelGet: Handler<"GET"> = (router, interaction, state) => {
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
					.setLabel("Signups")
					.setStyle(ButtonStyle.Secondary)
					.setTo("/signups"),
				new RouteButtonBuilder(router)
					.setLabel("Filter")
					.setStyle(ButtonStyle.Secondary)
					.setTo("/filter/global"),
				new RouteButtonBuilder(router)
					.setLabel("Ring recipients")
					.setStyle(ButtonStyle.Secondary)
					.setTo("/recipients/global"),
				new RouteButtonBuilder(router)
					.setLabel("Mode")
					.setStyle(ButtonStyle.Secondary)
					.setTo("/mode"),
				new RouteButtonBuilder(router)
					.setLabel("Delete data")
					.setStyle(ButtonStyle.Secondary)
					.setTo("/delete-data"),
			),
			row(
				new RouteButtonBuilder(router)
					.setLabel("Commands")
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

const commandsGet: Handler<"GET"> = (router, interaction, state) => {
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

export const homeHandlers = {
	panel: { get: panelGet } satisfies Handlers,
	commands: { get: commandsGet } satisfies Handlers,
};
