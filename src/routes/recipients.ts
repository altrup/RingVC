import { homeButton, paginationRows, row } from "@routes/lib/components";
import { confirmed, confirmModal } from "@routes/lib/confirm";
import { flashRedirect, withFlash } from "@routes/lib/flash";
import { diffSelection, PAGE_SIZE, paginate } from "@routes/lib/paging";
import { channelIdOf, scopeOf } from "@routes/lib/scope";
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

import { getAutoRingSetting, setAutoRing, unsetAutoRing } from "@db/auto-ring";
import {
	addDefaultRingee,
	clearDefaultRingees,
	getDefaultRingees,
	removeDefaultRingee,
} from "@db/default-ringees";
import { joinWithAnd, mentionUser } from "@main/ring";

const COLOR = "#747ac5";

const panelPath = (scope: string) => `/recipients/${scope}`;

// "for <#id>" / "globally"
const scopeSuffix = (scope: string) =>
	scope === "global" ? "globally" : `for <#${scope}>`;

// the channel override when in channel scope, the global setting, and the
// value that actually applies for the scope
const autoRingStatus = async (userId: string, channelId: string | null) => {
	const [override, global] = await Promise.all([
		channelId === null
			? Promise.resolve(undefined)
			: getAutoRingSetting(userId, channelId),
		getAutoRingSetting(userId, null),
	]);
	return {
		override,
		global: global ?? false,
		effective: override ?? global ?? false,
	};
};

const panelGet: Handler<"GET"> = async (router, interaction, state) => {
	const scope = scopeOf(state.params);
	const channelId = channelIdOf(scope);
	const userId = interaction.user.id;
	const [ringees, autoRing] = await Promise.all([
		getDefaultRingees(userId, channelId),
		autoRingStatus(userId, channelId),
	]);
	const sorted = [...ringees].sort();
	const { pageItems, page, pageCount } = paginate(
		sorted,
		state.queryParams.get("page"),
	);

	const autoRingLine =
		channelId === null
			? `Auto-ring: **${autoRing.effective ? "enabled" : "disabled"}**`
			: autoRing.override !== undefined
				? `Auto-ring: **${autoRing.override ? "enabled" : "disabled"}** for <#${channelId}> (overrides your global setting: ${autoRing.global ? "enabled" : "disabled"})`
				: `Auto-ring: **${autoRing.effective ? "enabled" : "disabled"}** (from your global setting)`;

	const memberList =
		pageItems.length > 0 ? pageItems.map(mentionUser).join(" ") : "None";
	const description = withFlash(
		state.queryParams,
		`These people get rung when you use Ring defaults${channelId ? ` in <#${channelId}>` : ""}, or on every voice channel join if auto-ring is enabled.\n\n` +
			`${autoRingLine}\n\n` +
			`**Recipients${pageCount > 1 ? ` (page ${page + 1} of ${pageCount})` : ""}:** ${memberList}`,
	);

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle(
					scope === "global"
						? "Your default ring recipients"
						: "Channel ring recipients",
				)
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
								? "Viewing channel recipients (clear for global)"
								: "View a voice channel's recipients",
						)
						.setDefaultChannels(...(channelId ? [channelId] : []))
						.setPattern("/recipients{/:channelId}"),
				)
				.toJSON(),
			new ActionRowBuilder<RouteUserSelectMenuBuilder>()
				.addComponents(
					new RouteUserSelectMenuBuilder(router)
						.setMinValues(0)
						.setMaxValues(PAGE_SIZE)
						.setPlaceholder(
							"Edit recipients: select to add, deselect to remove",
						)
						.setDefaultUsers(...pageItems)
						.setPattern(`${panelPath(scope)}/members`, {
							method: "POST",
							queryParams: { page: String(page) },
						}),
				)
				.toJSON(),
			row(
				new RouteButtonBuilder(router)
					.setLabel("Reset")
					.setStyle(ButtonStyle.Danger)
					.setTo(`${panelPath(scope)}/clear`, { method: "MODAL" }),
				new RouteButtonBuilder(router)
					.setLabel(
						autoRing.effective ? "Disable auto-ring" : "Enable auto-ring",
					)
					.setStyle(
						autoRing.effective ? ButtonStyle.Secondary : ButtonStyle.Success,
					)
					.setTo(`${panelPath(scope)}/auto-ring`, {
						method: "POST",
						queryParams: { enable: autoRing.effective ? "0" : "1" },
					}),
				...(channelId !== null && autoRing.override !== undefined
					? [
							new RouteButtonBuilder(router)
								.setLabel("Remove override")
								.setStyle(ButtonStyle.Secondary)
								.setTo(`${panelPath(scope)}/auto-ring/unset`, {
									method: "POST",
								}),
						]
					: []),
				homeButton(router),
			),
			...paginationRows(router, panelPath(scope), { page, pageCount }),
		],
	};
};

const membersPost: Handler<"POST"> = async (router, interaction, state) => {
	const scope = scopeOf(state.params);
	const channelId = channelIdOf(scope);
	const userId = interaction.user.id;
	const panel = panelPath(scope);

	const ringees = [...(await getDefaultRingees(userId, channelId))].sort();
	const { pageItems } = paginate(ringees, state.queryParams.get("page"));
	const { added, removed } = diffSelection({
		allItems: ringees,
		pageItems,
		submitted: state.values ?? pageItems,
	});

	await Promise.all([
		...added.map((id) => addDefaultRingee(userId, channelId, id)),
		...removed.map((id) => removeDefaultRingee(userId, channelId, id)),
	]);

	const parts = [
		...(added.length > 0
			? [`Added ${joinWithAnd(added.map(mentionUser))}`]
			: []),
		...(removed.length > 0
			? [`Removed ${joinWithAnd(removed.map(mentionUser))}`]
			: []),
	];
	const changed = parts.length > 0;
	return flashRedirect(
		panel,
		changed
			? `${parts.join(". ")} (default ring recipients ${scopeSuffix(scope)})`
			: `No changes to your default ring recipients ${scopeSuffix(scope)}`,
		changed ? "success" : "warn",
		{ page: state.queryParams.get("page") ?? "0" },
	);
};

const clearConfirm: Handler<"MODAL"> = (router, interaction, state) =>
	confirmModal(router, {
		to: `${panelPath(scopeOf(state.params))}/clear`,
		title: "Reset ring recipients",
		word: "RESET",
	});

const clearPost: Handler<"POST"> = async (router, interaction, state) => {
	const scope = scopeOf(state.params);
	if (!confirmed(state.fields, "RESET"))
		return flashRedirect(
			panelPath(scope),
			"Confirmation text did not match, your recipients were not cleared",
			"warn",
		);
	const cleared = await clearDefaultRingees(
		interaction.user.id,
		channelIdOf(scope),
	);
	return cleared
		? flashRedirect(
				panelPath(scope),
				`Cleared your default ring recipients ${scopeSuffix(scope)}`,
				"success",
			)
		: flashRedirect(
				panelPath(scope),
				`You already have no default ring recipients ${scopeSuffix(scope)}`,
				"warn",
			);
};

const autoRingPost: Handler<"POST"> = async (router, interaction, state) => {
	const scope = scopeOf(state.params);
	const channelId = channelIdOf(scope);
	const enable = state.queryParams.get("enable") === "1";
	const panel = panelPath(scope);

	const changed = await setAutoRing(interaction.user.id, channelId, enable);
	if (!changed)
		return flashRedirect(
			panel,
			`Auto-ring is already ${enable ? "enabled" : "disabled"} ${scopeSuffix(scope)}`,
			"warn",
		);
	return enable
		? flashRedirect(
				panel,
				`Auto-ring is now enabled ${scopeSuffix(scope)}. WARNING: joining ${channelId ? `<#${channelId}>` : "a voice channel"} now rings all of your default ring recipients, even in stealth mode`,
				"warn",
			)
		: flashRedirect(
				panel,
				`Auto-ring is now disabled ${scopeSuffix(scope)}`,
				"success",
			);
};

const autoRingUnsetPost: Handler<"POST"> = async (
	router,
	interaction,
	state,
) => {
	const scope = scopeOf(state.params);
	const channelId = channelIdOf(scope);
	const panel = panelPath(scope);
	if (channelId === null)
		return flashRedirect(
			panel,
			"Only channel scopes have an auto-ring override to remove",
			"warn",
		);

	const existed = await unsetAutoRing(interaction.user.id, channelId);
	return existed
		? flashRedirect(
				panel,
				`Removed the auto-ring override for <#${channelId}>; your global setting applies again`,
				"success",
			)
		: flashRedirect(
				panel,
				`You have no auto-ring override for <#${channelId}>`,
				"warn",
			);
};

export const recipientsHandlers = {
	panel: { get: panelGet } satisfies Handlers,
	members: { post: membersPost } satisfies Handlers,
	clear: { modal: clearConfirm, post: clearPost } satisfies Handlers,
	autoRing: { post: autoRingPost } satisfies Handlers,
	autoRingUnset: { post: autoRingUnsetPost } satisfies Handlers,
};
