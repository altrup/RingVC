import { navRow, paginationRows, row } from "@routes/lib/components";
import { flashRedirect, withFlash } from "@routes/lib/flash";
import { Page } from "@routes/lib/paging";
import { RingRouter } from "@routes/types";
import { RouteButtonBuilder, RouteRedirect } from "discord-embed-router";
import {
	APIActionRowComponent,
	APIComponentInMessageActionRow,
	ButtonStyle,
	EmbedBuilder,
	Guild,
} from "discord.js";

import { joinWithAnd } from "@main/ring";

import { COLOR, PANEL } from "../_shared";

export const BY_CHANNEL = "/signups/roles/by-channel";
export const BY_ROLE = "/signups/roles/by-role";

export type Orientation = "channel" | "role";

// the shared lead sentence; both orientations describe the same feature
const LEAD =
	"When someone joins a voice channel, its signed-up roles get pinged.";

// the orientation toggle: the active view is an inert Primary, the other a
// Secondary link that resets the scope (a channel id is not a role id)
const switchRow = (
	router: RingRouter,
	active: Orientation,
): APIActionRowComponent<APIComponentInMessageActionRow> =>
	row(
		new RouteButtonBuilder(router)
			.setLabel("By channel")
			.setStyle(
				active === "channel" ? ButtonStyle.Primary : ButtonStyle.Secondary,
			)
			.setDisabled(active === "channel")
			.setTo(BY_CHANNEL),
		new RouteButtonBuilder(router)
			.setLabel("By role")
			.setStyle(active === "role" ? ButtonStyle.Primary : ButtonStyle.Secondary)
			.setDisabled(active === "role")
			.setTo(BY_ROLE),
	);

// the scope carried in the path, or null when nothing is picked yet (unlike
// filter/recipients, role signups have no global scope to fall back to)
export const roleScopeOf = (
	params: Partial<Record<string, string | string[]>>,
): string | null =>
	typeof params.scope === "string" && params.scope.length > 0
		? params.scope
		: null;

// stable name ordering so a scope's links paginate the same way on the GET
// that renders the select and the POST that diffs its submission
export const sortRoleIds = (guild: Guild, ids: string[]): string[] =>
	[...ids].sort((a, b) =>
		(guild.roles.cache.get(a)?.name ?? a).localeCompare(
			guild.roles.cache.get(b)?.name ?? b,
		),
	);

export const sortChannelIds = (guild: Guild, ids: string[]): string[] =>
	[...ids].sort((a, b) =>
		(guild.channels.cache.get(a)?.name ?? a).localeCompare(
			guild.channels.cache.get(b)?.name ?? b,
		),
	);

// applies an add/remove edit against a scope's current links and reports the
// outcome as a flash. Adds/removes are filtered against the current set so
// the notice reflects real changes; both edit orientations mutate the same
// (channel, role) table through the passed callbacks
export const commitRoleEdit = async ({
	redirect,
	page,
	current,
	addsRequested,
	removesRequested,
	mutateAdd,
	mutateRemove,
	itemMention,
}: {
	redirect: string;
	page: number;
	current: string[];
	addsRequested: string[];
	removesRequested: string[];
	mutateAdd: (item: string) => Promise<boolean>;
	mutateRemove: (item: string) => Promise<boolean>;
	itemMention: (id: string) => string;
}): Promise<RouteRedirect> => {
	const currentSet = new Set(current);
	const toAdd = addsRequested.filter((item) => !currentSet.has(item));
	const toRemove = removesRequested.filter((item) => currentSet.has(item));
	await Promise.all([...toAdd.map(mutateAdd), ...toRemove.map(mutateRemove)]);

	const parts = [
		...(toAdd.length > 0
			? [`Added ${joinWithAnd(toAdd.map(itemMention))}`]
			: []),
		...(toRemove.length > 0
			? [`Removed ${joinWithAnd(toRemove.map(itemMention))}`]
			: []),
	];
	const changed = toAdd.length > 0 || toRemove.length > 0;
	const flash = changed
		? parts.join(". ")
		: addsRequested.length > 0
			? "Already signed up."
			: removesRequested.length > 0
				? "Those weren't signed up."
				: "No changes to role signups.";
	return flashRedirect(redirect, flash, changed ? "success" : "warn", {
		page: String(page),
	});
};

// assembles either orientation from its orientation-specific pieces: the
// caller builds the scope and edit selects (their menu types differ) and
// supplies the scope's current links; the frame, copy, and rows are shared
export const renderRoleScope = ({
	router,
	queryParams,
	active,
	scope,
	scopeMention,
	linkedLabel,
	linkedItems,
	itemMention,
	emptyHint,
	scopeSelectRow,
	editSelectRow,
	basePath,
	page,
	pageCount,
}: {
	router: RingRouter;
	queryParams: URLSearchParams;
	active: Orientation;
	scope: string | null;
	scopeMention: (id: string) => string;
	linkedLabel: string;
	linkedItems: string[];
	itemMention: (id: string) => string;
	emptyHint: string;
	scopeSelectRow: APIActionRowComponent<APIComponentInMessageActionRow>;
	// present only when a scope is picked; the empty view shows no edit select
	editSelectRow?:
		APIActionRowComponent<APIComponentInMessageActionRow> | undefined;
	basePath: string;
} & Pick<Page, "page" | "pageCount">) => {
	const linkedList =
		linkedItems.length > 0 ? linkedItems.map(itemMention).join(" ") : "None";
	const body = scope
		? `${LEAD}\n\n**Viewing** ${scopeMention(scope)}\n` +
			`**${linkedLabel}${pageCount > 1 ? ` (page ${page + 1} of ${pageCount})` : ""}** · ${linkedList}`
		: `${LEAD}\n\n${emptyHint}`;

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("🔔 Role signups")
				.setDescription(withFlash(queryParams, body)),
		],
		components: [
			switchRow(router, active),
			scopeSelectRow,
			...(scope && editSelectRow ? [editSelectRow] : []),
			navRow(router, PANEL),
			...paginationRows(router, basePath, { page, pageCount }),
		],
	};
};
