import {
	RouteButtonBuilder,
	RouteChannelSelectMenuBuilder,
	RouteRoleSelectMenuBuilder,
} from "discord-embed-router";
import { ActionRowBuilder, ButtonStyle, ChannelType } from "discord.js";

import { getVoiceChatSignups } from "@db/voice-chats";
import { mentionChannel } from "@main/ring";
import {
	editSelectRow,
	pagedControls,
	showOptionsOf,
} from "@routes/lib/components";
import { pagedCountLine, paginate } from "@routes/lib/paging";
import { Handler } from "@routes/types";

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

	const editSelect = editSelectRow(
		new RouteRoleSelectMenuBuilder(router).setDefaultRoles(...pageItems),
		{
			noun: "roles",
			pattern: `${BY_CHANNEL}/${scope}/roles`,
			page,
			timestamp: state.timestamp,
		},
	);

	return roleFrame({
		router,
		interaction,
		queryParams: state.queryParams,
		body:
			`${LEAD}\n\n**Viewing** ${mentionChannel(scope)}\n` +
			pagedCountLine("Roles", roleIds.length),
		// the scope select leads as the page's context, then its edit list and
		// pager; the switch and section bar follow in the frame
		rows: [
			scopeSelectRow,
			editSelect,
			...pagedControls(router, `${BY_CHANNEL}/${scope}`, {
				page,
				pageCount,
				showOptions: showOptionsOf(state.queryParams),
				options: [
					new RouteButtonBuilder(router)
						.setLabel("Reset")
						.setStyle(ButtonStyle.Secondary)
						.setTo(`${BY_CHANNEL}/${scope}/reset`, { method: "MODAL" }),
				],
			}),
		],
	});
};
