import { navBar, row, subNav } from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { commandMention } from "@routes/lib/mentions";
import { paginate, SELECT_MAX_VALUES } from "@routes/lib/paging";
import { channelIdOf, scopeOf } from "@routes/lib/scope";
import { Handler } from "@routes/types";
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

import { getAutoRingSetting } from "@db/auto-ring";
import { getDefaultRingees } from "@db/default-ringees";
import { mentionUser } from "@main/ring";

import { panelPath } from "../_shared";

const COLOR = "#8c89cd";

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

export const recipientsGet: Handler<"GET"> = async (
	router,
	interaction,
	state,
) => {
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

	const autoRingValue =
		channelId === null
			? autoRing.effective
				? "On"
				: "Off"
			: autoRing.override !== undefined
				? `${autoRing.override ? "On" : "Off"} for <#${channelId}> (global: ${autoRing.global ? "on" : "off"})`
				: `${autoRing.effective ? "On" : "Off"} (from your global setting)`;

	const memberList =
		pageItems.length > 0 ? pageItems.map(mentionUser).join(" ") : "None";
	const description = withFlash(
		state.queryParams,
		`These people get rung when you use ${commandMention(state.globals, "ring_defaults")}${channelId ? ` in <#${channelId}>` : ""}, or on every voice channel join if auto-ring is on.\n\n` +
			`**Auto-ring** · ${autoRingValue}\n` +
			`**Ringees${pageCount > 1 ? ` (page ${page + 1} of ${pageCount})` : ""}** · ${memberList}`,
	);

	const scopeSelect = new ActionRowBuilder<RouteChannelSelectMenuBuilder>()
		.addComponents(
			new RouteChannelSelectMenuBuilder(router)
				.setChannelTypes(ChannelType.GuildVoice)
				.setMinValues(0)
				.setMaxValues(1)
				.setPlaceholder(
					channelId
						? "Viewing channel ringees (clear for global)"
						: "View a voice channel's ringees",
				)
				.setDefaultChannels(...(channelId ? [channelId] : []))
				.setPattern("/recipients{/:channelId}"),
		)
		.toJSON();

	const editSelect = new ActionRowBuilder<RouteUserSelectMenuBuilder>()
		.addComponents(
			new RouteUserSelectMenuBuilder(router)
				.setMinValues(0)
				.setMaxValues(SELECT_MAX_VALUES)
				.setPlaceholder("Edit ringees: select to add, deselect to remove")
				.setDefaultUsers(...pageItems)
				.setPattern(`${panelPath(scope)}/members`, {
					method: "POST",
					queryParams: { page: String(page) },
				}),
		)
		.toJSON();

	const ringActions = row(
		// prev/next page the recipient list inline, so this dense panel
		// spends no separate row on pagination
		...(page > 0
			? [
					new RouteButtonBuilder(router)
						.setLabel("◀")
						.setStyle(ButtonStyle.Secondary)
						.setTo(panelPath(scope), {
							queryParams: { page: String(page - 1) },
						}),
				]
			: []),
		new RouteButtonBuilder(router)
			.setLabel(autoRing.effective ? "Disable auto-ring" : "Enable auto-ring")
			.setStyle(
				autoRing.effective ? ButtonStyle.Secondary : ButtonStyle.Success,
			)
			.setTo(`${panelPath(scope)}/auto-ring`, {
				method: "POST",
				queryParams: { enable: autoRing.effective ? "0" : "1" },
			}),
		new RouteButtonBuilder(router)
			.setLabel("Reset")
			.setStyle(ButtonStyle.Danger)
			.setTo(`${panelPath(scope)}/reset`, { method: "MODAL" }),
		...(page < pageCount - 1
			? [
					new RouteButtonBuilder(router)
						.setLabel("▶")
						.setStyle(ButtonStyle.Secondary)
						.setTo(panelPath(scope), {
							queryParams: { page: String(page + 1) },
						}),
				]
			: []),
	);

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle(
					scope === "global" ? "📣 Default ringees" : "📣 Channel ringees",
				)
				.setDescription(description),
		],
		// top to bottom within the page: the scope select leads as context, then
		// the ringee list and the actions (with the inline pager); the sub-nav and
		// section bar are navigation pinned at the bottom
		components: [
			scopeSelect,
			editSelect,
			ringActions,
			subNav(router, [
				{ label: "Quick ring", path: "/ring" },
				{ label: "Default ringees", path: panelPath(scope), active: true },
			]),
			navBar(router, interaction, { active: "ringees" }),
		],
	};
};
