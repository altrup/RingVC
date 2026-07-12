import {
	backButton,
	homeButton,
	paginationRows,
	row,
} from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { paginate } from "@routes/lib/paging";
import { Handler } from "@routes/types";
import {
	RouteRoleSelectMenuBuilder,
	RouteStringSelectMenuBuilder,
	RouteStringSelectMenuOptionBuilder,
} from "discord-embed-router";
import { ActionRowBuilder, EmbedBuilder } from "discord.js";

import { mentionRole } from "@main/ring";

import {
	canManageRoleSignups,
	COLOR,
	guildOnlyRender,
	mentionChannel,
	noPermissionRender,
	PANEL,
	ROLES,
	sortedRoleSignups,
} from "../_shared";

export const signupsRolesGet: Handler<"GET"> = async (
	router,
	interaction,
	state,
) => {
	const guild = interaction.guild;
	if (!guild)
		return { ...guildOnlyRender, components: [row(homeButton(router))] };
	if (!canManageRoleSignups(interaction)) return noPermissionRender(router);

	const mappings = await sortedRoleSignups(guild);
	const pageStrings = mappings.map(
		({ roleId, channelId }) => `${roleId}:${channelId}`,
	);
	const { pageItems, page, pageCount } = paginate(
		pageStrings,
		state.queryParams.get("page"),
	);

	const mappingLines =
		pageItems.length > 0
			? pageItems
					.map((pair) => {
						const [roleId = "", channelId = ""] = pair.split(":");
						return `${mentionRole(roleId)} → ${mentionChannel(channelId)}`;
					})
					.join("\n")
			: "None yet";
	const description = withFlash(
		state.queryParams,
		"When someone joins a channel, its signed-up roles get pinged.\n\n" +
			`**Role signups${pageCount > 1 ? ` (page ${page + 1} of ${pageCount})` : ""}:**\n${mappingLines}`,
	);

	const removeOptions = pageItems.map((pair) => {
		const [roleId = "", channelId = ""] = pair.split(":");
		return new RouteStringSelectMenuOptionBuilder(router)
			.setLabel(
				`@${guild.roles.cache.get(roleId)?.name ?? roleId} → #${guild.channels.cache.get(channelId)?.name ?? channelId}`,
			)
			.setTo(`${ROLES}/remove`, { queryParams: { pair } });
	});

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("Role signups")
				.setDescription(description),
		],
		components: [
			...(removeOptions.length > 0
				? [
						new ActionRowBuilder<RouteStringSelectMenuBuilder>()
							.addComponents(
								new RouteStringSelectMenuBuilder(router)
									.setTos(...removeOptions)
									.setPlaceholder("Remove role signups")
									.setMinValues(1)
									.setMaxValues(removeOptions.length)
									.setPattern(`${ROLES}/remove`, {
										method: "POST",
										queryParams: { page: String(page) },
									}),
							)
							.toJSON(),
					]
				: []),
			new ActionRowBuilder<RouteRoleSelectMenuBuilder>()
				.addComponents(
					new RouteRoleSelectMenuBuilder(router)
						.setMinValues(1)
						.setMaxValues(1)
						.setPlaceholder("Add a role signup: pick a role")
						.setPattern(`${ROLES}/:roleId`),
				)
				.toJSON(),
			row(backButton(router, PANEL), homeButton(router)),
			...paginationRows(router, ROLES, { page, pageCount }),
		],
	};
};
