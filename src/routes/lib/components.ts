import { Page } from "@routes/lib/paging";
import { RingButton, RingRouter } from "@routes/types";
import { RouteButtonBuilder } from "discord-embed-router";
import {
	ActionRowBuilder,
	APIActionRowComponent,
	APIComponentInMessageActionRow,
	ButtonBuilder,
	ButtonStyle,
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

// the navigation row every panel ends on: Back (when the panel has a parent)
// then Home, always last and on their own row, so navigation sits in the same
// place regardless of a panel's action buttons
export const navRow = (
	router: RingRouter,
	parentPath?: string,
): APIActionRowComponent<APIComponentInMessageActionRow> =>
	parentPath
		? row(backButton(router, parentPath), homeButton(router))
		: row(homeButton(router));

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
