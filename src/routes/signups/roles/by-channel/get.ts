import { paginationRows } from "@routes/lib/components";
import {
	pagedCountLine,
	pagedEditParams,
	paginate,
	SELECT_MAX_VALUES,
} from "@routes/lib/paging";
import { Handler } from "@routes/types";
import {
	RouteChannelSelectMenuBuilder,
	RouteRoleSelectMenuBuilder,
} from "discord-embed-router";
import { ActionRowBuilder, ChannelType } from "discord.js";

import { getVoiceChatSignups } from "@db/voice-chats";

import {
	BY_CHANNEL,
	LEAD,
	roleFrame,
	roleScopeOf,
	sortRoleIds,
} from "../_shared";
import {
	canManageRoleSignups,
	guildOnlyRender,
	mentionChannel,
	noPermissionRender,
} from "../../_shared";
import { rolesGet } from "../get";

export const rolesByChannelGet: Handler<"GET"> = async (
	router,
	interaction,
	state,
) => {
	const guild = interaction.guild;
	if (!guild) return guildOnlyRender(router);
	if (!canManageRoleSignups(interaction)) return noPermissionRender(router);

	const scope = roleScopeOf(state.params);
	if (!scope) return rolesGet(router, interaction, state);

	const roleIds = sortRoleIds(
		guild,
		(await getVoiceChatSignups(scope)).roleIds,
	);
	const { pageItems, page, pageCount } = paginate(
		roleIds,
		state.queryParams.get("page"),
	);

	const scopeSelectRow = new ActionRowBuilder<RouteChannelSelectMenuBuilder>()
		.addComponents(
			new RouteChannelSelectMenuBuilder(router)
				.setChannelTypes(ChannelType.GuildVoice)
				.setMinValues(0)
				.setMaxValues(1)
				.setPlaceholder(
					"Viewing a voice channel's roles (clear to pick another)",
				)
				.setDefaultChannels(scope)
				.setPattern(`${BY_CHANNEL}{/:channelId}`),
		)
		.toJSON();

	const editSelectRow = new ActionRowBuilder<RouteRoleSelectMenuBuilder>()
		.addComponents(
			new RouteRoleSelectMenuBuilder(router)
				.setMinValues(0)
				.setMaxValues(SELECT_MAX_VALUES)
				.setPlaceholder("Edit roles: select to add, deselect to remove")
				.setDefaultRoles(...pageItems)
				.setPattern(`${BY_CHANNEL}/${scope}/roles`, {
					method: "POST",
					queryParams: pagedEditParams(page, state.timestamp),
				}),
		)
		.toJSON();

	return roleFrame({
		router,
		interaction,
		queryParams: state.queryParams,
		body:
			`${LEAD}\n\n**Viewing** ${mentionChannel(scope)}\n` +
			pagedCountLine("Roles pinged here", roleIds.length, pageCount),
		// the scope select leads as the page's context, then its edit list and
		// pager; the switch and section bar follow in the frame
		rows: [
			scopeSelectRow,
			editSelectRow,
			...paginationRows(router, `${BY_CHANNEL}/${scope}`, { page, pageCount }),
		],
	});
};
