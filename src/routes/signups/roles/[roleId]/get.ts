import { backButton, homeButton, row } from "@routes/lib/components";
import { withFlash } from "@routes/lib/flash";
import { Handler } from "@routes/types";
import { RouteChannelSelectMenuBuilder } from "discord-embed-router";
import { ActionRowBuilder, ChannelType, EmbedBuilder } from "discord.js";

import { mentionRole } from "@main/ring";

import {
	canManageRoleSignups,
	COLOR,
	guildOnlyRender,
	noPermissionRender,
	ROLES,
} from "../../_shared";

export const signupsRoleGet: Handler<"GET"> = async (
	router,
	interaction,
	state,
) => {
	const guild = interaction.guild;
	if (!guild)
		return { ...guildOnlyRender, components: [row(homeButton(router))] };
	if (!canManageRoleSignups(interaction)) return noPermissionRender(router);

	const roleId =
		typeof state.params.roleId === "string" ? state.params.roleId : "";

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("Add a role signup")
				.setDescription(
					withFlash(
						state.queryParams,
						`Signing up ${mentionRole(roleId)}: pick the voice channel it should be pinged for.`,
					),
				),
		],
		components: [
			new ActionRowBuilder<RouteChannelSelectMenuBuilder>()
				.addComponents(
					new RouteChannelSelectMenuBuilder(router)
						.setChannelTypes(ChannelType.GuildVoice)
						.setMinValues(1)
						.setMaxValues(1)
						.setPlaceholder(`Pick a channel for the role`)
						.setPattern(`${ROLES}/${roleId}`, {
							method: "POST",
							queryParams: { channel: ":channelId" },
						}),
				)
				.toJSON(),
			row(backButton(router, ROLES, "Cancel"), homeButton(router)),
		],
	};
};
