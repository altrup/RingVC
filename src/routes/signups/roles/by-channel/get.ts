import { homeButton, row } from "@routes/lib/components";
import { PAGE_SIZE, paginate } from "@routes/lib/paging";
import { Handler } from "@routes/types";
import {
	RouteChannelSelectMenuBuilder,
	RouteRoleSelectMenuBuilder,
} from "discord-embed-router";
import { ActionRowBuilder, ChannelType } from "discord.js";

import { getVoiceChatSignups } from "@db/voice-chats";
import { mentionRole } from "@main/ring";

import {
	BY_CHANNEL,
	renderRoleScope,
	roleScopeOf,
	sortRoleIds,
} from "../_shared";
import {
	canManageRoleSignups,
	guildOnlyRender,
	mentionChannel,
	noPermissionRender,
} from "../../_shared";

export const rolesByChannelGet: Handler<"GET"> = async (
	router,
	interaction,
	state,
) => {
	const guild = interaction.guild;
	if (!guild)
		return { ...guildOnlyRender, components: [row(homeButton(router))] };
	if (!canManageRoleSignups(interaction)) return noPermissionRender(router);

	const scope = roleScopeOf(state.params);
	const roleIds = scope
		? sortRoleIds(guild, (await getVoiceChatSignups(scope)).roleIds)
		: [];
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
					scope
						? "Viewing a channel's roles (clear to pick another)"
						: "View a voice channel's roles",
				)
				.setDefaultChannels(...(scope ? [scope] : []))
				.setPattern(`${BY_CHANNEL}{/:channelId}`),
		)
		.toJSON();

	const editSelectRow = scope
		? new ActionRowBuilder<RouteRoleSelectMenuBuilder>()
				.addComponents(
					new RouteRoleSelectMenuBuilder(router)
						.setMinValues(0)
						.setMaxValues(PAGE_SIZE)
						.setPlaceholder("Edit roles: select to add, deselect to remove")
						.setDefaultRoles(...pageItems)
						.setPattern(`${BY_CHANNEL}/${scope}/roles`, {
							method: "POST",
							queryParams: { page: String(page) },
						}),
				)
				.toJSON()
		: undefined;

	return renderRoleScope({
		router,
		queryParams: state.queryParams,
		active: "channel",
		scope,
		scopeMention: mentionChannel,
		linkedLabel: "Roles pinged here",
		linkedItems: pageItems,
		itemMention: mentionRole,
		emptyHint: "Pick a channel above to view or edit its roles.",
		scopeSelectRow,
		editSelectRow,
		basePath: `${BY_CHANNEL}/${scope}`,
		page,
		pageCount,
	});
};
