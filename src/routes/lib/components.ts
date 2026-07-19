import {
	RouteButtonBuilder,
	RouteChannelSelectMenuBuilder,
	RouteRoleSelectMenuBuilder,
	RouteStringSelectMenuBuilder,
	RouteStringSelectMenuOptionBuilder,
	RouteUserSelectMenuBuilder,
} from "discord-embed-router";
import {
	ActionRowBuilder,
	APIActionRowComponent,
	APIComponentInMessageActionRow,
	ButtonBuilder,
	ButtonStyle,
	Interaction,
} from "discord.js";

import { buttonEmoji, VC_EMOJI_ID } from "@routes/lib/emoji";
import { Page, pagedEditPattern, SELECT_MAX_VALUES } from "@routes/lib/paging";
import { PAGE_JUMP } from "@routes/page-jump/_shared";
import { RingButton, RingRouter } from "@routes/types";

export const row = (
	...components: ButtonBuilder[]
): APIActionRowComponent<APIComponentInMessageActionRow> =>
	new ActionRowBuilder<ButtonBuilder>().addComponents(...components).toJSON();

// the add/remove select every paged member panel shares: the page's entries
// ride in as the caller-set defaults, and selecting or deselecting them posts
// the diff. The caller supplies the entity-specific builder (with its default
// entries and any channel-type filter already set) and the noun the shared
// placeholder reads; the row-reset key keeps a stale client selection from
// surviving the next render
export const editSelectRow = <
	B extends
		| RouteUserSelectMenuBuilder
		| RouteRoleSelectMenuBuilder
		| RouteChannelSelectMenuBuilder,
>(
	builder: B,
	{
		noun,
		pattern,
		page,
		timestamp,
	}: { noun: string; pattern: string; page: number; timestamp: number },
): APIActionRowComponent<APIComponentInMessageActionRow> => {
	builder
		.setMinValues(0)
		.setMaxValues(SELECT_MAX_VALUES)
		.setPlaceholder(`Edit ${noun}: select to add, deselect to remove`)
		.setPattern(pattern, pagedEditPattern(page, timestamp));
	return new ActionRowBuilder<B>().addComponents(builder).toJSON();
};

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

// the top-level sections, one per entry in the section bar (SECTIONS below)
export type Section =
	| "home"
	| "signups"
	| "filters"
	| "ringees"
	| "mode"
	| "help"
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
	{ section: "help", label: "📖 Help", path: "/help" },
	{ section: "about", label: "ℹ️ About", path: "/about" },
	{ section: "delete", label: "🗑️ Delete data", path: "/delete-data" },
];

// the persistent section bar every panel ends on, as a string select so all
// sections fit one row. Its placeholder is an action prompt ("Switch sections")
// rather than the current section: the panel title already names where you are,
// and a prompt reads as navigation instead of a stored value; selecting any
// section routes there. The Signups option carries the branded voice-chat emoji
// when the bot can use it, else a unicode bell
export const navBar = (
	router: RingRouter,
	interaction: Interaction,
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
		const builder = new RouteStringSelectMenuOptionBuilder(router).setTo(
			target,
		);
		if (section === "signups" && vc) builder.setLabel("Signups").setEmoji(vc);
		else builder.setLabel(label);
		return builder;
	};

	// each option carries its own encoded target, and the builder's default
	// pattern routes the submission to the selected one
	const select = new RouteStringSelectMenuBuilder(router)
		.setPlaceholder("Switch sections")
		.setTos(SECTIONS.map(option));

	return new ActionRowBuilder<RouteStringSelectMenuBuilder>()
		.addComponents(select)
		.toJSON();
};

// the sub-view switch a section shows just above the bar when it has sibling
// views (e.g. My signups / Role signups, Quick ring / Default ringees). The
// current view is an inert Primary prefixed "Viewing:" to name where you are;
// the others are Secondary links
export const subNav = (
	router: RingRouter,
	items: { label: string; path: string; active?: boolean }[],
): APIActionRowComponent<APIComponentInMessageActionRow> =>
	row(
		...items.map((item) =>
			new RouteButtonBuilder(router)
				.setLabel(item.active ? `Viewing: ${item.label}` : item.label)
				.setStyle(item.active ? ButtonStyle.Primary : ButtonStyle.Secondary)
				.setDisabled(item.active ?? false)
				// a sub-nav item can point at the same path as the bar's active tab
				// (e.g. Default ringees / the Ring tab); the key keeps their
				// customIds distinct, which Discord requires within one message
				.setTo(item.path, { key: "subnav" }),
		),
	);

// a paged panel's control row. With one page (the common case) the option
// buttons show directly — no toggle burying the panel's controls; destructive
// ones (Reset) stay safe behind their own confirm modal. Only when a pager
// needs the row too does a ⚙ toggle appear, swapping between the page controls
// and the options, keyed by the `options` query param. A panel with no options
// and one page contributes no row, so the result is spread into a components
// array
export const pagedControls = (
	router: RingRouter,
	basePath: string,
	{
		page,
		pageCount,
		showOptions,
		options,
	}: Pick<Page, "page" | "pageCount"> & {
		showOptions: boolean;
		options: RingButton[];
	},
): APIActionRowComponent<APIComponentInMessageActionRow>[] => {
	const pageButton = (label: string, target: number, disabled: boolean) =>
		new RouteButtonBuilder(router)
			.setLabel(label)
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(disabled)
			.setTo(basePath, { queryParams: { page: String(target) } });
	const pager =
		pageCount <= 1
			? []
			: [
					pageButton("◀ Prev", page - 1, page === 0),
					// the middle button doubles as a page jump: it opens a modal asking
					// which page to show, which redirects back to basePath
					new RouteButtonBuilder(router)
						.setLabel(`Page ${page + 1} of ${pageCount}`)
						.setStyle(ButtonStyle.Secondary)
						.setTo(PAGE_JUMP, {
							method: "MODAL",
							queryParams: {
								to: basePath,
								page: String(page),
								pageCount: String(pageCount),
							},
						}),
					pageButton("Next ▶", page + 1, page === pageCount - 1),
				];
	if (options.length === 0) return pager.length > 0 ? [row(...pager)] : [];
	// no pager competing for the row: the options own it and show directly
	if (pager.length === 0) return [row(...options)];
	// a pager shares the row, so the ⚙ toggle swaps between the two; it leads
	// the row (a fixed slot the variable-width pager can't shift), and the open
	// options lead with the way back to the page controls
	if (showOptions)
		return [
			row(
				new RouteButtonBuilder(router)
					.setLabel("◀ Back")
					.setStyle(ButtonStyle.Secondary)
					.setTo(basePath, { queryParams: { page: String(page) } }),
				...options,
			),
		];
	return [
		row(
			new RouteButtonBuilder(router)
				.setLabel("⚙ Options")
				.setStyle(ButtonStyle.Secondary)
				.setTo(basePath, {
					queryParams: { page: String(page), options: "1" },
				}),
			...pager,
		),
	];
};

// reads the `options` query param pagedControls' switch buttons carry
export const showOptionsOf = (queryParams: URLSearchParams): boolean =>
	queryParams.get("options") === "1";
