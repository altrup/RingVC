import { navBar, paginationRows, row } from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { PAGE_SIZE, paginate } from "@routes/lib/paging";
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
		`These people get rung when you use Ring defaults${channelId ? ` in <#${channelId}>` : ""}, or on every voice channel join if auto-ring is on.\n\n` +
			`**Auto-ring** · ${autoRingValue}\n` +
			`**Recipients${pageCount > 1 ? ` (page ${page + 1} of ${pageCount})` : ""}** · ${memberList}`,
	);

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle(
					scope === "global"
						? "📣 Default ring recipients"
						: "📣 Channel ring recipients",
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
				new RouteButtonBuilder(router)
					.setLabel("Reset")
					.setStyle(ButtonStyle.Danger)
					.setTo(`${panelPath(scope)}/reset`, { method: "MODAL" }),
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
			),
			navBar(router, interaction, "ringees"),
			...paginationRows(router, panelPath(scope), { page, pageCount }),
		],
	};
};
