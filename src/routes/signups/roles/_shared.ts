import { RouteRedirect } from "discord-embed-router";
import {
	APIActionRowComponent,
	APIComponentInMessageActionRow,
	EmbedBuilder,
	Guild,
	Interaction,
} from "discord.js";

import { joinWithAnd } from "@main/ring";
import { navBar, subNav } from "@routes/lib/components";
import { flashRedirect, withFlash } from "@routes/lib/flash";
import { paginate, withPageLabel } from "@routes/lib/paging";
import { RingRouter } from "@routes/types";

import { canManageRoleSignups, COLOR, PANEL, ROLES } from "../_shared";

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

// the guard every role-signups mutation shares: rejects edits outside a
// guild, without Manage Roles, or before a scope is picked. On success
// returns the resolved guild and scope; otherwise the flash to redirect with
export const roleEditGuard = (
	interaction: Interaction,
	params: Partial<Record<string, string | string[]>>,
	{ base, noun }: { base: string; noun: string },
): { guild: Guild; scope: string } | RouteRedirect => {
	const guild = interaction.guild;
	if (!guild)
		return flashRedirect(
			interaction,
			base,
			"Signups only work inside a Discord server",
			"warn",
		);
	if (!canManageRoleSignups(interaction))
		return flashRedirect(
			interaction,
			base,
			"You need the Manage Roles permission to manage role signups",
			"warn",
		);
	const scope = roleScopeOf(params);
	if (!scope)
		return flashRedirect(interaction, base, `Pick a ${noun} first`, "warn");
	return { guild, scope };
};

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

// applies an add/remove edit against a scope's current links and reports it as
// a flash. Adds/removes are filtered against the current set so the notice
// reflects real changes; both orientations mutate the same table via callbacks
export const commitRoleEdit = async ({
	interaction,
	redirect,
	page,
	current,
	addsRequested,
	removesRequested,
	alreadyPresent = [],
	mutateAdd,
	mutateRemove,
	itemMention,
	sortItems,
	alreadySignedUp,
	notSignedUp,
}: {
	interaction: Interaction;
	redirect: string;
	page: number;
	current: string[];
	addsRequested: string[];
	removesRequested: string[];
	alreadyPresent?: string[];
	mutateAdd: (item: string) => Promise<boolean>;
	mutateRemove: (item: string) => Promise<boolean>;
	itemMention: (id: string) => string;
	sortItems: (items: string[]) => string[];
	// the no-op sentences, oriented by the caller so both name role and channel
	alreadySignedUp: (items: string[]) => string;
	notSignedUp: (items: string[]) => string;
}): Promise<RouteRedirect> => {
	const currentSet = new Set(current);
	const toAdd = addsRequested.filter((item) => !currentSet.has(item));
	const toRemove = removesRequested.filter((item) => currentSet.has(item));
	await Promise.all([...toAdd.map(mutateAdd), ...toRemove.map(mutateRemove)]);

	// the post-edit list places every entry the flash mentions, so entries
	// that land or live off the rendered page get a page label
	const removeSet = new Set(toRemove);
	const after = sortItems([
		...current.filter((item) => !removeSet.has(item)),
		...toAdd,
	]);
	const { page: viewedPage } = paginate(after, String(page));
	const label = withPageLabel(after, itemMention, viewedPage);

	const parts = [
		...(toAdd.length > 0 ? [`Added ${joinWithAnd(toAdd.map(label))}`] : []),
		...(toRemove.length > 0
			? [`Removed ${joinWithAnd(toRemove.map(itemMention))}`]
			: []),
		...(alreadyPresent.length > 0
			? [
					`${joinWithAnd(alreadyPresent.map(label))} ${alreadyPresent.length > 1 ? "are" : "is"} already signed up`,
				]
			: []),
	];
	const changed = toAdd.length > 0 || toRemove.length > 0;
	const flash =
		parts.length > 0
			? parts.join(". ")
			: addsRequested.length > 0
				? alreadySignedUp(addsRequested)
				: removesRequested.length > 0
					? notSignedUp(removesRequested)
					: "No changes to role signups.";
	return flashRedirect(
		interaction,
		redirect,
		flash,
		changed ? "success" : "warn",
		{
			page: String(page),
		},
	);
};

// the frame every role-signups view ends in: the caller's content rows, then
// the My signups / Role signups switch, then the section bar
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
		navBar(router, interaction),
	],
});
