import { buttonEmoji, VC_EMOJI_ID } from "@routes/lib/emoji";
import { Page } from "@routes/lib/paging";
import { RingButton, RingRouter } from "@routes/types";
import {
	RouteButtonBuilder,
	RouteStringSelectMenuBuilder,
	RouteStringSelectMenuOptionBuilder,
} from "discord-embed-router";
import {
	ActionRowBuilder,
	APIActionRowComponent,
	APIComponentInMessageActionRow,
	ButtonBuilder,
	ButtonStyle,
	Interaction,
} from "discord.js";

export const row = (
	...components: ButtonBuilder[]
): APIActionRowComponent<APIComponentInMessageActionRow> =>
	new ActionRowBuilder<ButtonBuilder>().addComponents(...components).toJSON();

export const homeButton = (router: RingRouter): RingButton =>
	new RouteButtonBuilder(router)
		.setLabel("🏠 Home")
		.setStyle(ButtonStyle.Secondary)
		.setTo("/");

export const backButton = (
	router: RingRouter,
	path: string,
	label = "Back",
): RingButton =>
	new RouteButtonBuilder(router)
		.setLabel(label)
		.setStyle(ButtonStyle.Secondary)
		.setTo(path);

// the top-level section a panel belongs to, so the section bar can mark it as
// the current selection. Panels with no section (Ring quick-panel, error
// states) pass nothing, and the menu shows its placeholder instead
export type Section =
	| "home"
	| "signups"
	| "filters"
	| "ringees"
	| "mode"
	| "commands"
	| "about"
	| "delete";

type Tab = { section: Section; label: string; path: string };

// every section in one menu; a string select holds all of them, so there is
// no five-button row cap to page around
const SECTIONS: readonly Tab[] = [
	{ section: "home", label: "🏠 Home", path: "/" },
	{ section: "signups", label: "🔔 Signups", path: "/signups" },
	{ section: "filters", label: "🛡️ Filters", path: "/filter/global" },
	{ section: "ringees", label: "📣 Ring", path: "/recipients/global" },
	{ section: "mode", label: "💤 Mode", path: "/mode" },
	{ section: "commands", label: "📖 Commands", path: "/commands" },
	{ section: "about", label: "ℹ️ About", path: "/about" },
	{ section: "delete", label: "🗑️ Delete data", path: "/delete-data" },
];

// the persistent section bar every panel ends on, as a string select so all
// sections fit one row. The active section is the menu's default option, so it
// shows as the current value; reselecting it just reloads that section. The
// Signups option carries the branded voice-chat emoji when the bot can use it,
// else a unicode bell
export const navBar = (
	router: RingRouter,
	interaction: Interaction,
	{ active }: { active?: Section },
): APIActionRowComponent<APIComponentInMessageActionRow> => {
	const vc = buttonEmoji(interaction, VC_EMOJI_ID);
	// the Ring section lands on the immediate ring action when the user is in a
	// voice channel, and on the default-recipients settings otherwise, so it
	// never opens the "not in a voice channel" notice by default
	const inVoice = !!(
		interaction.member &&
		"voice" in interaction.member &&
		interaction.member.voice.channel
	);

	const option = ({ section, label, path }: Tab) => {
		const target = section === "ringees" && inVoice ? "/ring" : path;
		const builder = new RouteStringSelectMenuOptionBuilder(router)
			.setTo(target)
			.setDefault(section === active);
		if (section === "signups" && vc) builder.setLabel("Signups").setEmoji(vc);
		else builder.setLabel(label);
		return builder;
	};

	// each option carries its own encoded target, and the builder's default
	// pattern routes the submission to the selected one
	const select = new RouteStringSelectMenuBuilder(router)
		.setPlaceholder("Jump to a section")
		.setTos(SECTIONS.map(option));

	return new ActionRowBuilder<RouteStringSelectMenuBuilder>()
		.addComponents(select)
		.toJSON();
};

// the sub-view switch a section shows just above the bar when it has sibling
// views (e.g. My signups / Role signups, Ring now / Default ringees). The
// current view is an inert Primary; the others are Secondary links
export const subNav = (
	router: RingRouter,
	items: { label: string; path: string; active?: boolean }[],
): APIActionRowComponent<APIComponentInMessageActionRow> =>
	row(
		...items.map((item) =>
			new RouteButtonBuilder(router)
				.setLabel(item.label)
				.setStyle(item.active ? ButtonStyle.Primary : ButtonStyle.Secondary)
				.setDisabled(item.active ?? false)
				// a sub-nav item can point at the same path as the bar's active tab
				// (e.g. Default ringees / the Ring tab); the key keeps their
				// customIds distinct, which Discord requires within one message
				.setTo(item.path, { key: "subnav" }),
		),
	);

// the conditional pagination row: absent for single-page lists, so the
// result is spread into a components array
export const paginationRows = (
	router: RingRouter,
	basePath: string,
	{ page, pageCount }: Pick<Page, "page" | "pageCount">,
): APIActionRowComponent<APIComponentInMessageActionRow>[] => {
	if (pageCount <= 1) return [];
	const pageButton = (label: string, target: number, disabled: boolean) =>
		new RouteButtonBuilder(router)
			.setLabel(label)
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(disabled)
			.setTo(basePath, { queryParams: { page: String(target) } });
	return [
		row(
			pageButton("◀ Prev", page - 1, page === 0),
			pageButton(`Page ${page + 1} of ${pageCount}`, page, true),
			pageButton("Next ▶", page + 1, page === pageCount - 1),
		),
	];
};
