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
// as the active tab. Utility panels (Commands, Ring, Delete data) belong to no
// section and pass nothing
export type Section = "home" | "signups" | "filters" | "ringees" | "mode";

// the persistent section bar every panel ends on: one button per top-level
// section, always in the same place. The active section is an inert Primary so
// it reads as "you are here"; the Signups entry carries the branded voice-chat
// emoji when the bot can use it, falling back to a unicode bell
export const navBar = (
	router: RingRouter,
	interaction: Interaction,
	active?: Section,
): APIActionRowComponent<APIComponentInMessageActionRow> => {
	const tab = (section: Section, label: string, path: string): RingButton =>
		new RouteButtonBuilder(router)
			.setLabel(label)
			.setStyle(
				section === active ? ButtonStyle.Primary : ButtonStyle.Secondary,
			)
			.setDisabled(section === active)
			.setTo(path);

	const vc = buttonEmoji(interaction, VC_EMOJI_ID);
	const signups = tab("signups", vc ? "Signups" : "🔔 Signups", "/signups");
	if (vc) signups.setEmoji(vc);

	return row(
		tab("home", "🏠 Home", "/"),
		signups,
		tab("filters", "🛡️ Filters", "/filter/global"),
		tab("ringees", "📣 Ringees", "/recipients/global"),
		tab("mode", "💤 Mode", "/mode"),
	);
};

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
