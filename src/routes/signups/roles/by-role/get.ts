import { homeButton, row } from "@routes/lib/components";
import { paginate, SELECT_MAX_VALUES } from "@routes/lib/paging";
import { Handler } from "@routes/types";
import {
	RouteChannelSelectMenuBuilder,
	RouteRoleSelectMenuBuilder,
} from "discord-embed-router";
import { ActionRowBuilder, ChannelType } from "discord.js";

import { getVoiceChatRoleSignups } from "@db/voice-chats";
import { mentionRole } from "@main/ring";

import {
	BY_ROLE,
	renderRoleScope,
	roleScopeOf,
	sortChannelIds,
} from "../_shared";
import {
	canManageRoleSignups,
	guildOnlyRender,
	guildVoiceChannelIds,
	mentionChannel,
	noPermissionRender,
} from "../../_shared";
import { rolesGet } from "../get";

export const rolesByRoleGet: Handler<"GET"> = async (
	router,
	interaction,
	state,
) => {
	const guild = interaction.guild;
	if (!guild)
		return { ...guildOnlyRender, components: [row(homeButton(router))] };
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
					queryParams: { page: String(page) },
				}),
		)
		.toJSON();

	return renderRoleScope({
		router,
		interaction,
		queryParams: state.queryParams,
		scope,
		scopeMention: mentionRole,
		linkedLabel: "Signed up for",
		linkedItems: pageItems,
		itemMention: mentionChannel,
		scopeSelectRow,
		editSelectRow,
		basePath: `${BY_ROLE}/${scope}`,
		page,
		pageCount,
	});
};
