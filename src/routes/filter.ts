import { homeButton, paginationRows, row } from "@routes/lib/components";
import { flashRedirect, withFlash } from "@routes/lib/flash";
import { diffSelection, PAGE_SIZE, paginate } from "@routes/lib/paging";
import { channelIdOf, scopeName, scopeOf } from "@routes/lib/scope";
import { Handler, Handlers } from "@routes/types";
import {
	RouteButtonBuilder,
	RouteChannelSelectMenuBuilder,
	RouteUserSelectMenuBuilder,
} from "discord-embed-router";
import {
	ActionRowBuilder,
	ButtonStyle,
	ChannelType,
	EmbedBuilder,
} from "discord.js";

import {
	addFilterEntry,
	filterType,
	getFilter,
	removeFilterEntry,
	resetFilter,
	setFilterType,
} from "@db/filters";
import { joinWithAnd, mentionUser } from "@main/ring";

const COLOR = "#94ab62";

const panelPath = (scope: string) => `/filter/${scope}`;

const panelGet: Handler<"GET"> = async (router, interaction, state) => {
	const scope = scopeOf(state.params);
	const channelId = channelIdOf(scope);
	const filter = await getFilter(interaction.user.id, channelId);
	const type = filterType(filter);
	const entries = [...(filter?.entries ?? [])].sort();
	const { pageItems, page, pageCount } = paginate(
		entries,
		state.queryParams.get("page"),
	);

	const memberList =
		pageItems.length > 0 ? pageItems.map(mentionUser).join(" ") : "None";
	const description = withFlash(
		state.queryParams,
		`${scopeName(scope, "filter", { capitalize: true })} is a **${type}**.\n` +
			(type === "whitelist"
				? "Only the people listed here can ring you, and you only ring them."
				: "The people listed here can't ring you, and you won't ring them.") +
			`\n\n**Members${pageCount > 1 ? ` (page ${page + 1} of ${pageCount})` : ""}:** ${memberList}`,
	);

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle(scope === "global" ? "Your global filter" : "Channel filter")
				.setDescription(description),
		],
		components: [
			new ActionRowBuilder<RouteChannelSelectMenuBuilder>()
				.addComponents(
					new RouteChannelSelectMenuBuilder(router)
						.setChannelTypes(ChannelType.GuildVoice)
						.setMinValues(0)
						.setMaxValues(1)
						.setPlaceholder(
							channelId
								? "Viewing a channel filter (clear for global)"
								: "View a voice channel's filter",
						)
						.setDefaultChannels(...(channelId ? [channelId] : []))
						.setPattern("/filter{/:channelId}"),
				)
				.toJSON(),
			new ActionRowBuilder<RouteUserSelectMenuBuilder>()
				.addComponents(
					new RouteUserSelectMenuBuilder(router)
						.setMinValues(0)
						.setMaxValues(PAGE_SIZE)
						.setPlaceholder("Edit members: select to add, deselect to remove")
						.setDefaultUsers(...pageItems)
						.setPattern(`${panelPath(scope)}/members`, {
							method: "POST",
							queryParams: { page: String(page) },
						}),
				)
				.toJSON(),
			row(
				new RouteButtonBuilder(router)
					.setLabel(
						type === "blacklist"
							? "Switch to Whitelist"
							: "Switch to Blacklist",
					)
					.setStyle(ButtonStyle.Primary)
					.setTo(`${panelPath(scope)}/type`, {
						method: "POST",
						queryParams: {
							to: type === "blacklist" ? "whitelist" : "blacklist",
						},
					}),
				new RouteButtonBuilder(router)
					.setLabel("Reset")
					.setStyle(ButtonStyle.Danger)
					.setTo(`${panelPath(scope)}/reset`, { method: "POST" }),
				homeButton(router),
			),
			...paginationRows(router, panelPath(scope), { page, pageCount }),
		],
	};
};

// one members editor serves the panel select and the /block, /unblock,
// /whitelist and /unwhitelist adapters; `intent` keys the guard that stops
// blocklist-style edits on a whitelist (and vice versa) so the rule exists
// exactly once
const membersPost: Handler<"POST"> = async (router, interaction, state) => {
	const scope = scopeOf(state.params);
	const channelId = channelIdOf(scope);
	const userId = interaction.user.id;
	const query = state.queryParams;
	const intent = query.get("intent") ?? "edit";
	const panel = panelPath(scope);

	const filter = await getFilter(userId, channelId);
	const type = filterType(filter);

	if (intent === "block" && type === "whitelist")
		return flashRedirect(
			panel,
			"Your global filter is a whitelist. Switch it to a blacklist below, or use /whitelist and /unwhitelist instead.",
			"warn",
		);
	if (intent === "whitelist" && type === "blacklist")
		return flashRedirect(
			panel,
			"Your global filter is a blacklist. Switch it to a whitelist below, or use /block and /unblock instead.",
			"warn",
		);

	const entries = [...(filter?.entries ?? [])].sort();
	let addsRequested: string[];
	let removesRequested: string[];
	if (state.values) {
		const { pageItems } = paginate(entries, query.get("page"));
		({ added: addsRequested, removed: removesRequested } = diffSelection({
			allItems: entries,
			pageItems,
			submitted: state.values,
		}));
	} else {
		addsRequested = query.getAll("add");
		removesRequested = query.getAll("remove");
	}

	const entrySet = new Set(entries);
	const toAdd = addsRequested.filter((id) => !entrySet.has(id));
	const toRemove = removesRequested.filter((id) => entrySet.has(id));
	await Promise.all([
		...toAdd.map((id) => addFilterEntry(userId, channelId, id)),
		...toRemove.map((id) => removeFilterEntry(userId, channelId, id)),
	]);

	const changed = toAdd.length > 0 || toRemove.length > 0;
	const target = mentionUser(addsRequested[0] ?? removesRequested[0] ?? "");
	let flash: string;
	if (intent === "block") {
		flash =
			addsRequested.length > 0
				? toAdd.length > 0
					? `Blocked ${target}`
					: `${target} is already blocked`
				: toRemove.length > 0
					? `Unblocked ${target}`
					: `${target} isn't blocked`;
	} else if (intent === "whitelist") {
		flash =
			addsRequested.length > 0
				? toAdd.length > 0
					? `Whitelisted ${target}`
					: `${target} is already whitelisted`
				: toRemove.length > 0
					? `Removed ${target} from your whitelist`
					: `${target} isn't on your whitelist`;
	} else {
		const parts = [
			...(toAdd.length > 0
				? [`Added ${joinWithAnd(toAdd.map(mentionUser))}`]
				: []),
			...(toRemove.length > 0
				? [`Removed ${joinWithAnd(toRemove.map(mentionUser))}`]
				: []),
		];
		flash =
			parts.length > 0
				? `${parts.join(". ")} (${scopeName(scope, type)})`
				: `No changes to ${scopeName(scope, type)}`;
	}

	return flashRedirect(panel, flash, changed ? "success" : "warn", {
		page: query.get("page") ?? "0",
	});
};

const typePost: Handler<"POST"> = async (router, interaction, state) => {
	const scope = scopeOf(state.params);
	const channelId = channelIdOf(scope);
	const panel = panelPath(scope);
	const to =
		state.queryParams.get("to") === "whitelist" ? "whitelist" : "blacklist";

	const filter = await getFilter(interaction.user.id, channelId);
	if (filterType(filter) === to)
		return flashRedirect(
			panel,
			`${scopeName(scope, "filter", { capitalize: true })} is already a ${to}`,
			"warn",
		);

	await setFilterType(interaction.user.id, channelId, to === "whitelist");
	return flashRedirect(
		panel,
		`${scopeName(scope, "filter", { capitalize: true })} was reset and changed to a ${to}`,
		"warn",
	);
};

const resetPost: Handler<"POST"> = async (router, interaction, state) => {
	const scope = scopeOf(state.params);
	const panel = panelPath(scope);
	const wasNotDefault = await resetFilter(
		interaction.user.id,
		channelIdOf(scope),
	);
	return wasNotDefault
		? flashRedirect(
				panel,
				`${scopeName(scope, "filter", { capitalize: true })} has been reset and is an empty blacklist`,
				"success",
			)
		: flashRedirect(
				panel,
				`${scopeName(scope, "filter", { capitalize: true })} is already the default (an empty blacklist)`,
				"warn",
			);
};

export const filterHandlers = {
	panel: { get: panelGet } satisfies Handlers,
	members: { post: membersPost } satisfies Handlers,
	type: { post: typePost } satisfies Handlers,
	reset: { post: resetPost } satisfies Handlers,
};
