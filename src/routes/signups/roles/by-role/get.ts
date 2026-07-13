import { homeButton, row } from "@routes/lib/components";
import { PAGE_SIZE, paginate } from "@routes/lib/paging";
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
	const channelIds = scope
		? sortChannelIds(
				guild,
				(await getVoiceChatRoleSignups(guildVoiceChannelIds(guild)))
					.filter((mapping) => mapping.roleId === scope)
					.map((mapping) => mapping.channelId),
			)
		: [];
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
					scope
						? "Viewing a role's channels (clear to pick another)"
						: "View a role's channels",
				)
				.setDefaultRoles(...(scope ? [scope] : []))
				.setPattern(`${BY_ROLE}{/:roleId}`),
		)
		.toJSON();

	const editSelectRow = scope
		? new ActionRowBuilder<RouteChannelSelectMenuBuilder>()
				.addComponents(
					new RouteChannelSelectMenuBuilder(router)
						.setChannelTypes(ChannelType.GuildVoice)
						.setMinValues(0)
						.setMaxValues(PAGE_SIZE)
						.setPlaceholder("Edit channels: select to add, deselect to remove")
						.setDefaultChannels(...pageItems)
						.setPattern(`${BY_ROLE}/${scope}/channels`, {
							method: "POST",
							queryParams: { page: String(page) },
						}),
				)
				.toJSON()
		: undefined;

	return renderRoleScope({
		router,
		queryParams: state.queryParams,
		active: "role",
		scope,
		scopeMention: mentionRole,
		linkedLabel: "Signed up for",
		linkedItems: pageItems,
		itemMention: mentionChannel,
		emptyHint: "Pick a role above to view or edit its channels.",
		scopeSelectRow,
		editSelectRow,
		basePath: `${BY_ROLE}/${scope}`,
		page,
		pageCount,
	});
};
