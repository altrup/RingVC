import {
	RouteButtonBuilder,
	RouteChannelSelectMenuBuilder,
} from "discord-embed-router";
import {
	ActionRowBuilder,
	ButtonStyle,
	ChannelType,
	EmbedBuilder,
} from "discord.js";

import {
	navBar,
	pagedControls,
	showOptionsOf,
	subNav,
} from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import {
	pagedCountLine,
	pagedEditPattern,
	paginate,
	SELECT_MAX_VALUES,
} from "@routes/lib/paging";
import { Handler } from "@routes/types";

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
	if (!guild) return guildOnlyRender(router, interaction);

	const signups = await guildSignups(interaction.user.id, guild);
	const { pageItems, page, pageCount } = paginate(
		signups,
		state.queryParams.get("page"),
	);

	const description = withFlash(
		state.queryParams,
		"You get rung when someone starts a call in one of your signed-up channels. Edit them below.\n\n" +
			pagedCountLine("Signups", signups.length),
	);

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("🔔 Signups")
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
						.setPattern(
							`${PANEL}/members`,
							pagedEditPattern(page, state.timestamp),
						),
				)
				.toJSON(),
			...pagedControls(router, PANEL, {
				page,
				pageCount,
				showOptions: showOptionsOf(state.queryParams),
				options: [
					new RouteButtonBuilder(router)
						.setLabel("Reset")
						.setStyle(ButtonStyle.Secondary)
						.setTo(`${PANEL}/reset`, { method: "MODAL" }),
				],
			}),
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
			navBar(router, interaction),
		],
	};
};
