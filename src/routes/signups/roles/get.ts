import { homeButton, row } from "@routes/lib/components";
import { Handler } from "@routes/types";
import {
	RouteChannelSelectMenuBuilder,
	RouteRoleSelectMenuBuilder,
} from "discord-embed-router";
import { ActionRowBuilder, ChannelType } from "discord.js";

import { BY_CHANNEL, BY_ROLE, renderRoleNeutral } from "./_shared";
import {
	canManageRoleSignups,
	guildOnlyRender,
	noPermissionRender,
} from "../_shared";

export const rolesGet: Handler<"GET"> = async (router, interaction, state) => {
	const guild = interaction.guild;
	if (!guild)
		return { ...guildOnlyRender, components: [row(homeButton(router))] };
	if (!canManageRoleSignups(interaction)) return noPermissionRender(router);

	const channelSelectRow = new ActionRowBuilder<RouteChannelSelectMenuBuilder>()
		.addComponents(
			new RouteChannelSelectMenuBuilder(router)
				.setChannelTypes(ChannelType.GuildVoice)
				.setMinValues(0)
				.setMaxValues(1)
				.setPlaceholder("View a voice channel's roles")
				.setPattern(`${BY_CHANNEL}{/:channelId}`),
		)
		.toJSON();

	const roleSelectRow = new ActionRowBuilder<RouteRoleSelectMenuBuilder>()
		.addComponents(
			new RouteRoleSelectMenuBuilder(router)
				.setMinValues(0)
				.setMaxValues(1)
				.setPlaceholder("View a role's voice channels")
				.setPattern(`${BY_ROLE}{/:roleId}`),
		)
		.toJSON();

	return renderRoleNeutral({
		router,
		interaction,
		queryParams: state.queryParams,
		channelSelectRow,
		roleSelectRow,
	});
};
