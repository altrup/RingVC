import { navBar, paginationRows, row } from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { paginate, SELECT_MAX_VALUES } from "@routes/lib/paging";
import { channelIdOf, scopeName, scopeOf } from "@routes/lib/scope";
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

import { filterType, getFilter } from "@db/filters";
import { mentionUser } from "@main/ring";

import { panelPath } from "../_shared";

const COLOR = "#63a471";

export const filterGet: Handler<"GET"> = async (router, interaction, state) => {
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
			`\n\n**Members${pageCount > 1 ? ` (page ${page + 1} of ${pageCount})` : ""}** · ${memberList}`,
	);

	const scopeSelect = new ActionRowBuilder<RouteChannelSelectMenuBuilder>()
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
		.toJSON();

	const editSelect = new ActionRowBuilder<RouteUserSelectMenuBuilder>()
		.addComponents(
			new RouteUserSelectMenuBuilder(router)
				.setMinValues(0)
				.setMaxValues(SELECT_MAX_VALUES)
				.setPlaceholder("Edit members: select to add, deselect to remove")
				.setDefaultUsers(...pageItems)
				.setPattern(`${panelPath(scope)}/members`, {
					method: "POST",
					queryParams: { page: String(page) },
				}),
		)
		.toJSON();

	const filterActions = row(
		new RouteButtonBuilder(router)
			.setLabel(
				type === "blacklist" ? "Switch to Whitelist" : "Switch to Blacklist",
			)
			.setStyle(ButtonStyle.Primary)
			.setTo(`${panelPath(scope)}/type`, {
				method: "POST",
				queryParams: { to: type === "blacklist" ? "whitelist" : "blacklist" },
			}),
		new RouteButtonBuilder(router)
			.setLabel("Reset")
			.setStyle(ButtonStyle.Danger)
			.setTo(`${panelPath(scope)}/reset`, { method: "MODAL" }),
	);

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle(
					scope === "global" ? "🛡️ Your global filter" : "🛡️ Channel filter",
				)
				.setDescription(description),
		],
		// top to bottom within the page: the scope select leads as context, then
		// the member list with its pager and the filter-wide actions; the section
		// bar is the global nav pinned at the bottom
		components: [
			scopeSelect,
			editSelect,
			...paginationRows(router, panelPath(scope), { page, pageCount }),
			filterActions,
			navBar(router, interaction, { active: "filters" }),
		],
	};
};
