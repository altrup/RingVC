import { backButton, homeButton, row } from "@routes/lib/components";
import { Handler } from "@routes/types";
import {
	EmbedBuilder,
	Guild,
	Interaction,
	PermissionsBitField,
} from "discord.js";

import {
	getUserVoiceChatSignups,
	getVoiceChatRoleSignups,
} from "@db/voice-chats";

export const COLOR = "#31a5a5";
export const PANEL = "/signups";
export const ROLES = "/signups/roles";

export const mentionChannel = (channelId: string) => `<#${channelId}>`;

export const canManageRoleSignups = (interaction: Interaction): boolean =>
	interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles) ===
		true ||
	interaction.memberPermissions?.has(
		PermissionsBitField.Flags.Administrator,
	) === true;

export const guildVoiceChannelIds = (guild: Guild): string[] =>
	[...guild.channels.cache.values()]
		.filter((channel) => channel.isVoiceBased())
		.map((channel) => channel.id);

// panels are ephemeral and per-guild; anything reached outside a guild
// (e.g. a DM) has nothing to show
export const guildOnlyRender = (router: Parameters<Handler<"GET">>[0]) => ({
	embeds: [
		new EmbedBuilder()
			.setColor(COLOR)
			.setTitle("Signups")
			.setDescription("⚠️ Signups only work inside a Discord server"),
	],
	components: [row(homeButton(router))],
});

// the user's signups, restricted to this guild's voice channels and sorted
// by channel name for stable paging
export const guildSignups = async (
	userId: string,
	guild: Guild,
): Promise<string[]> => {
	const channelIds = new Set(guildVoiceChannelIds(guild));
	return (await getUserVoiceChatSignups(userId))
		.filter((channelId) => channelIds.has(channelId))
		.sort((a, b) =>
			(guild.channels.cache.get(a)?.name ?? a).localeCompare(
				guild.channels.cache.get(b)?.name ?? b,
			),
		);
};

// stable ordering for paging: by role name, then channel name
export const sortedRoleSignups = async (guild: Guild) => {
	const nameOf = (roleId: string, channelId: string) =>
		`${guild.roles.cache.get(roleId)?.name ?? roleId} ${guild.channels.cache.get(channelId)?.name ?? channelId}`;
	return (await getVoiceChatRoleSignups(guildVoiceChannelIds(guild))).sort(
		(a, b) =>
			nameOf(a.roleId, a.channelId).localeCompare(
				nameOf(b.roleId, b.channelId),
			),
	);
};

export const noPermissionRender = (router: Parameters<Handler<"GET">>[0]) => ({
	embeds: [
		new EmbedBuilder()
			.setColor(COLOR)
			.setTitle("Role signups")
			.setDescription(
				"⚠️ You need the Manage Roles permission to manage role signups",
			),
	],
	components: [row(backButton(router, PANEL), homeButton(router))],
});
