import { pagedControls, showOptionsOf } from "@routes/lib/components";
import {
	pagedCountLine,
	pagedEditParams,
	paginate,
	SELECT_MAX_VALUES,
} from "@routes/lib/paging";
import { Handler } from "@routes/types";
import {
	RouteButtonBuilder,
	RouteChannelSelectMenuBuilder,
	RouteRoleSelectMenuBuilder,
} from "discord-embed-router";
import { ActionRowBuilder, ButtonStyle, ChannelType } from "discord.js";

import { getVoiceChatRoleSignups } from "@db/voice-chats";
import { mentionRole } from "@main/ring";

import {
	BY_ROLE,
	LEAD,
	roleFrame,
	roleScopeOf,
	sortChannelIds,
} from "../_shared";
import {
	canManageRoleSignups,
	guildOnlyRender,
	guildVoiceChannelIds,
	noPermissionRender,
} from "../../_shared";
import { rolesGet } from "../get";

export const rolesByRoleGet: Handler<"GET"> = async (
	router,
	interaction,
	state,
) => {
	const guild = interaction.guild;
	if (!guild) return guildOnlyRender(router);
	if (!canManageRoleSignups(interaction)) return noPermissionRender(router);

	const scope = roleScopeOf(state.params);
	if (!scope) return rolesGet(router, interaction, state);

	const channelIds = sortChannelIds(
		guild,
		(await getVoiceChatRoleSignups(guildVoiceChannelIds(guild)))
			.filter((mapping) => mapping.roleId === scope)
			.map((mapping) => mapping.channelId),
	);
	const { pageItems, page, pageCount } = paginate(
		channelIds,
		state.queryParams.get("page"),
	);

	const scopeSelectRow = new ActionRowBuilder<RouteRoleSelectMenuBuilder>()
		.addComponents(
			new RouteRoleSelectMenuBuilder(router)
				.setMinValues(0)
				.setMaxValues(1)
				.setPlaceholder(
					"Viewing a role's voice channels (clear to pick another)",
				)
				.setDefaultRoles(scope)
				.setPattern(`${BY_ROLE}{/:roleId}`),
		)
		.toJSON();

	const editSelectRow = new ActionRowBuilder<RouteChannelSelectMenuBuilder>()
		.addComponents(
			new RouteChannelSelectMenuBuilder(router)
				.setChannelTypes(ChannelType.GuildVoice)
				.setMinValues(0)
				.setMaxValues(SELECT_MAX_VALUES)
				.setPlaceholder(
					"Edit voice channels: select to add, deselect to remove",
				)
				.setDefaultChannels(...pageItems)
				.setPattern(`${BY_ROLE}/${scope}/channels`, {
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
			`${LEAD}\n\n**Viewing** ${mentionRole(scope)}\n` +
			pagedCountLine("Signed up for", channelIds.length, pageCount),
		// the scope select leads as the page's context, then its edit list and
		// pager; the switch and section bar follow in the frame
		rows: [
			scopeSelectRow,
			editSelectRow,
			...pagedControls(router, `${BY_ROLE}/${scope}`, {
				page,
				pageCount,
				showOptions: showOptionsOf(state.queryParams),
				options: [
					new RouteButtonBuilder(router)
						.setLabel("Reset")
						.setStyle(ButtonStyle.Danger)
						.setTo(`${BY_ROLE}/${scope}/reset`, { method: "MODAL" }),
				],
			}),
		],
	});
};
