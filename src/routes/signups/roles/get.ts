import {
	RouteChannelSelectMenuBuilder,
	RouteRoleSelectMenuBuilder,
} from "discord-embed-router";
import { ActionRowBuilder, ChannelType } from "discord.js";

import { Handler } from "@routes/types";

import {
	canManageRoleSignups,
	guildOnlyRender,
	noPermissionRender,
} from "../_shared";
import { BY_CHANNEL, BY_ROLE, LEAD, roleFrame } from "./_shared";

export const rolesGet: Handler<"GET"> = async (router, interaction, state) => {
	const guild = interaction.guild;
	if (!guild) return guildOnlyRender(router, interaction);
	if (!canManageRoleSignups(interaction)) return noPermissionRender(router, interaction);

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

	// the entry view with nothing picked: the first select the user touches
	// sets the orientation; clearing that scope later returns here
	return roleFrame({
		router,
		interaction,
		queryParams: state.queryParams,
		body: `${LEAD}\n\nPick a voice channel or a role below to view and edit its signups.`,
		rows: [channelSelectRow, roleSelectRow],
	});
};
