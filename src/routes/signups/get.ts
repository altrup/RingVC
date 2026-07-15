import {
	homeButton,
	navBar,
	paginationRows,
	row,
	subNav,
} from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import {
	pagedCountLine,
	paginate,
	SELECT_MAX_VALUES,
} from "@routes/lib/paging";
import { Handler } from "@routes/types";
import { RouteChannelSelectMenuBuilder } from "discord-embed-router";
import { ActionRowBuilder, ChannelType, EmbedBuilder } from "discord.js";

import {
	canManageRoleSignups,
	COLOR,
	guildOnlyRender,
	guildSignups,
	PANEL,
	ROLES,
} from "./_shared";

export const signupsGet: Handler<"GET"> = async (
	router,
	interaction,
	state,
) => {
	const guild = interaction.guild;
	if (!guild)
		return { ...guildOnlyRender, components: [row(homeButton(router))] };

	const signups = await guildSignups(interaction.user.id, guild);
	const { pageItems, page, pageCount } = paginate(
		signups,
		state.queryParams.get("page"),
	);

	const description = withFlash(
		state.queryParams,
		"You get rung when someone starts a call in one of your signed-up channels. Edit them below.\n\n" +
			pagedCountLine("Signups", signups.length, pageCount),
	);

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("🔔 Your signups")
				.setDescription(description),
		],
		components: [
			new ActionRowBuilder<RouteChannelSelectMenuBuilder>()
				.addComponents(
					new RouteChannelSelectMenuBuilder(router)
						.setChannelTypes(ChannelType.GuildVoice)
						.setMinValues(0)
						.setMaxValues(SELECT_MAX_VALUES)
						.setPlaceholder("Edit signups: select to add, deselect to remove")
						.setDefaultChannels(...pageItems)
						.setPattern(`${PANEL}/members`, {
							method: "POST",
							queryParams: { page: String(page) },
						}),
				)
				.toJSON(),
			...paginationRows(router, PANEL, { page, pageCount }),
			// the switch into role signups is a management action, so it only
			// appears for members who can manage role signups
			...(canManageRoleSignups(interaction)
				? [
						subNav(router, [
							{ label: "My signups", path: PANEL, active: true },
							{ label: "Role signups", path: ROLES },
						]),
					]
				: []),
			navBar(router, interaction, { active: "signups" }),
		],
	};
};
