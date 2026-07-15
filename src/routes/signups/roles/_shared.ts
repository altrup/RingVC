import { navBar, subNav } from "@routes/lib/components";
import { flashRedirect, withFlash } from "@routes/lib/flash";
import { withPageLabel } from "@routes/lib/paging";
import { RingRouter } from "@routes/types";
import { RouteRedirect } from "discord-embed-router";
import {
	APIActionRowComponent,
	APIComponentInMessageActionRow,
	EmbedBuilder,
	Guild,
	Interaction,
} from "discord.js";

import { joinWithAnd } from "@main/ring";

import { COLOR, PANEL, ROLES } from "../_shared";

export const BY_CHANNEL = "/signups/roles/by-channel";
export const BY_ROLE = "/signups/roles/by-role";

// the shared lead sentence; both orientations describe the same feature
export const LEAD =
	"When someone joins a voice channel, its signed-up roles get pinged.";

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
	alreadyPresent = [],
	mutateAdd,
	mutateRemove,
	itemMention,
}: {
	redirect: string;
	page: number;
	current: string[];
	addsRequested: string[];
	removesRequested: string[];
	alreadyPresent?: string[];
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
		...(alreadyPresent.length > 0
			? [
					`${joinWithAnd(alreadyPresent.map(withPageLabel(current, itemMention)))} ${alreadyPresent.length > 1 ? "are" : "is"} already signed up`,
				]
			: []),
	];
	const changed = toAdd.length > 0 || toRemove.length > 0;
	const flash =
		parts.length > 0
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

// the frame every role-signups view ends in. Rows read low-to-high level top to
// bottom: the caller's content rows, then the My signups / Role signups switch,
// then the section bar
export const roleFrame = ({
	router,
	interaction,
	queryParams,
	body,
	rows,
}: {
	router: RingRouter;
	interaction: Interaction;
	queryParams: URLSearchParams;
	body: string;
	rows: APIActionRowComponent<APIComponentInMessageActionRow>[];
}) => ({
	embeds: [
		new EmbedBuilder()
			.setColor(COLOR)
			.setTitle("🔔 Role signups")
			.setDescription(withFlash(queryParams, body)),
	],
	components: [
		...rows,
		subNav(router, [
			{ label: "My signups", path: PANEL },
			{ label: "Role signups", path: ROLES, active: true },
		]),
		navBar(router, interaction, { active: "signups" }),
	],
});
