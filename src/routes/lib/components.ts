import { buttonEmoji, VC_EMOJI_ID } from "@routes/lib/emoji";
import { Page } from "@routes/lib/paging";
import { RingButton, RingRouter } from "@routes/types";
import { RouteButtonBuilder } from "discord-embed-router";
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

// the top-level section a panel belongs to, so the section bar can render it
// as the active tab. Panels with no section (Ring, error states) pass nothing
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

// the eight section tabs split across two pages of four; a pager fills each
// row's fifth slot, so the two pages together reach every section
const PAGE_ONE: readonly Tab[] = [
	{ section: "home", label: "🏠 Home", path: "/" },
	{ section: "signups", label: "🔔 Signups", path: "/signups" },
	{ section: "filters", label: "🛡️ Filters", path: "/filter/global" },
	{ section: "ringees", label: "📣 Ring", path: "/recipients/global" },
];

const PAGE_TWO: readonly Tab[] = [
	{ section: "mode", label: "💤 Mode", path: "/mode" },
	{ section: "commands", label: "📖 Commands", path: "/commands" },
	{ section: "about", label: "ℹ️ About", path: "/about" },
	{ section: "delete", label: "🗑️ Delete data", path: "/delete-data" },
];

// the persistent section bar every panel ends on. The active section is a
// Primary tab, inert only on its own root so that on a sub-page or another
// scope it stays a live link back to that root. The Signups tab carries the
// branded voice-chat emoji when the bot can use it, else a unicode bell
export const navBar = (
	router: RingRouter,
	interaction: Interaction,
	{
		active,
		path,
		queryParams,
	}: { active?: Section; path: string; queryParams: URLSearchParams },
): APIActionRowComponent<APIComponentInMessageActionRow> => {
	// open on the page holding the active section so the current tab is always
	// visible; the pager's nav param overrides that to peek at the other page
	// without leaving the panel
	const override = queryParams.get("nav");
	const onPageTwo =
		override === "2" ||
		(override !== "1" && PAGE_TWO.some((t) => t.section === active));
	const vc = buttonEmoji(interaction, VC_EMOJI_ID);
	// the Ring section lands on the immediate ring action when the user is in a
	// voice channel, and on the default-recipients settings otherwise, so the
	// tab never opens the "not in a voice channel" notice by default
	const inVoice = !!(
		interaction.member &&
		"voice" in interaction.member &&
		interaction.member.voice.channel
	);

	const tab = ({ section, label, path: to }: Tab): RingButton => {
		const target = section === "ringees" && inVoice ? "/ring" : to;
		const button = new RouteButtonBuilder(router)
			// the active tab is Primary, except Delete data reads as its
			// destructive Danger red when it is the one selected
			.setStyle(
				section !== active
					? ButtonStyle.Secondary
					: section === "delete"
						? ButtonStyle.Danger
						: ButtonStyle.Primary,
			)
			.setDisabled(section === active && target === path)
			.setTo(target);
		if (section === "signups" && vc) button.setLabel("Signups").setEmoji(vc);
		else button.setLabel(label);
		return button;
	};

	// the pager reloads the current panel showing the other page of tabs
	const pager = (label: string, page: "1" | "2"): RingButton =>
		new RouteButtonBuilder(router)
			.setLabel(label)
			.setStyle(ButtonStyle.Secondary)
			.setTo(path, { queryParams: { nav: page } });

	const tabs = (onPageTwo ? PAGE_TWO : PAGE_ONE).map(tab);
	return row(
		...(onPageTwo
			? [pager("◀ Back", "1"), ...tabs]
			: [...tabs, pager("More ▶", "2")]),
	);
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
