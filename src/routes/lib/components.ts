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
// the diff. The caller supplies the builder (defaults and channel-type filter
// already set) and the noun the shared placeholder reads
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

export const backButton = (router: RingRouter, path: string): RingButton =>
	new RouteButtonBuilder(router)
		.setLabel("Back")
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

// every section the bar offers, in display order
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

// the persistent section bar every panel ends on. A string select fits all
// sections in one row (dodging the five-button cap); the placeholder is an
// action prompt since the panel title already names where you are
export const navBar = (
	router: RingRouter,
	interaction: Interaction,
): APIActionRowComponent<APIComponentInMessageActionRow> => {
	const vc = buttonEmoji(interaction, VC_EMOJI_ID);
	// the Ring option lands on the immediate ring action when in a voice channel,
	// else the default-recipients settings, so it never opens the "not in VC" notice
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

	// each option encodes its own target; the default pattern routes to the picked one
	const select = new RouteStringSelectMenuBuilder(router)
		.setPlaceholder("Switch sections")
		.setTos(SECTIONS.map(option));

	return new ActionRowBuilder<RouteStringSelectMenuBuilder>()
		.addComponents(select)
		.toJSON();
};

// the sub-view switch a section shows above the bar when it has sibling views.
// The active view is an inert Primary prefixed "Viewing:"; the others are links
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
				// a sub-nav item can share a path with the bar's active tab; the key
				// keeps their customIds distinct, which Discord requires per message
				.setTo(item.path, { key: "subnav" }),
		),
	);

// a paged panel's control row. With one page the options show directly; only
// when a pager also needs the row does a ⚙ toggle swap between page controls
// and options, keyed by the `options` query param. No pager, no options: no row
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
					// the middle button opens a page-jump modal that redirects back to basePath
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
	// pager and options share the row: the ⚙ toggle leads (a fixed slot the
	// variable-width pager can't shift), and the open options lead with a way back
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
