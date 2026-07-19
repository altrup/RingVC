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
import {
	editSelectRow,
	navBar,
	pagedControls,
	showOptionsOf,
} from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { pagedCountLine, paginate } from "@routes/lib/paging";
import { channelIdOf, scopeName, scopeOf } from "@routes/lib/scope";
import { Handler } from "@routes/types";

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

	const description = withFlash(
		state.queryParams,
		`${scopeName(scope, "filter", { capitalize: true })} is a **${type}**.\n` +
			(type === "whitelist"
				? "Only the people listed below can ring you, and you only ring them."
				: "The people listed below can't ring you, and you won't ring them.") +
			`\n\n${pagedCountLine("Members", entries.length)}`,
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

	const editSelect = editSelectRow(
		new RouteUserSelectMenuBuilder(router).setDefaultUsers(...pageItems),
		{
			noun: "members",
			pattern: `${panelPath(scope)}/members`,
			page,
			timestamp: state.timestamp,
		},
	);

	const filterOptions = [
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
	];

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle(
					scope === "global" ? "🛡️ Global filter" : "🛡️ Channel filter",
				)
				.setDescription(description),
		],
		// top to bottom within the page: the scope select leads as context, then
		// the member list and its control row (pager or the filter-wide options);
		// the section bar is the global nav pinned at the bottom
		components: [
			scopeSelect,
			editSelect,
			...pagedControls(router, panelPath(scope), {
				page,
				pageCount,
				showOptions: showOptionsOf(state.queryParams),
				options: filterOptions,
			}),
			navBar(router, interaction, { active: "filters" }),
		],
	};
};
