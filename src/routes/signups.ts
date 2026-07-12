import {
	backButton,
	homeButton,
	paginationRows,
	row,
} from "@routes/lib/components";
import { flashRedirect, withFlash } from "@routes/lib/flash";
import { diffSelection, PAGE_SIZE, paginate } from "@routes/lib/paging";
import { Handler, Handlers } from "@routes/types";
import {
	RouteButtonBuilder,
	RouteChannelSelectMenuBuilder,
	RouteRoleSelectMenuBuilder,
	RouteStringSelectMenuBuilder,
	RouteStringSelectMenuOptionBuilder,
} from "discord-embed-router";
import {
	ActionRowBuilder,
	ButtonStyle,
	ChannelType,
	EmbedBuilder,
	Guild,
	Interaction,
	PermissionsBitField,
} from "discord.js";

import {
	addVoiceChatRole,
	addVoiceChatUser,
	getUserVoiceChatSignups,
	getVoiceChatRoleSignups,
	removeVoiceChatRole,
	removeVoiceChatUser,
} from "@db/voice-chats";
import { joinWithAnd, mentionRole } from "@main/ring";

const COLOR = "#62a8ab";
const PANEL = "/signups";
const ROLES = "/signups/roles";

const mentionChannel = (channelId: string) => `<#${channelId}>`;

const canManageRoleSignups = (interaction: Interaction): boolean =>
	interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles) ===
		true ||
	interaction.memberPermissions?.has(
		PermissionsBitField.Flags.Administrator,
	) === true;

const guildVoiceChannelIds = (guild: Guild): string[] =>
	[...guild.channels.cache.values()]
		.filter((channel) => channel.isVoiceBased())
		.map((channel) => channel.id);

// panels are ephemeral and per-guild; anything reached outside a guild
// (e.g. a DM) has nothing to show
const guildOnlyRender = {
	embeds: [
		new EmbedBuilder()
			.setColor(COLOR)
			.setTitle("Signups")
			.setDescription("⚠️ Signups only work inside a Discord server"),
	],
	components: [],
};

// the user's signups, restricted to this guild's voice channels and sorted
// by channel name for stable paging
const guildSignups = async (
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

const panelGet: Handler<"GET"> = async (router, interaction, state) => {
	const guild = interaction.guild;
	if (!guild)
		return { ...guildOnlyRender, components: [row(homeButton(router))] };

	const signups = await guildSignups(interaction.user.id, guild);
	const { pageItems, page, pageCount } = paginate(
		signups,
		state.queryParams.get("page"),
	);

	const channelList =
		pageItems.length > 0 ? pageItems.map(mentionChannel).join(" ") : "None";
	const description = withFlash(
		state.queryParams,
		"You get rung when someone starts a call in one of these channels.\n\n" +
			`**Your signups in this server${pageCount > 1 ? ` (page ${page + 1} of ${pageCount})` : ""}:** ${channelList}`,
	);

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("Your signups")
				.setDescription(description),
		],
		components: [
			new ActionRowBuilder<RouteChannelSelectMenuBuilder>()
				.addComponents(
					new RouteChannelSelectMenuBuilder(router)
						.setChannelTypes(ChannelType.GuildVoice)
						.setMinValues(0)
						.setMaxValues(PAGE_SIZE)
						.setPlaceholder("Edit signups: select to add, deselect to remove")
						.setDefaultChannels(...pageItems)
						.setPattern(`${PANEL}/members`, {
							method: "POST",
							queryParams: { page: String(page) },
						}),
				)
				.toJSON(),
			row(
				new RouteButtonBuilder(router)
					.setLabel("Role signups")
					.setStyle(ButtonStyle.Secondary)
					.setTo(ROLES),
				homeButton(router),
			),
			...paginationRows(router, PANEL, { page, pageCount }),
		],
	};
};

// serves the panel's diff select and the /signup, /unsignup and /quit
// adapters (which pass add/remove channel ids as query params)
const membersPost: Handler<"POST"> = async (router, interaction, state) => {
	const guild = interaction.guild;
	if (!guild)
		return flashRedirect(
			PANEL,
			"Signups only work inside a Discord server",
			"warn",
		);

	const userId = interaction.user.id;
	const query = state.queryParams;
	let addsRequested: string[];
	let removesRequested: string[];
	if (state.values) {
		const signups = await guildSignups(userId, guild);
		const { pageItems } = paginate(signups, query.get("page"));
		({ added: addsRequested, removed: removesRequested } = diffSelection({
			allItems: signups,
			pageItems,
			submitted: state.values,
		}));
	} else {
		addsRequested = query.getAll("add");
		removesRequested = query.getAll("remove");
	}

	const added: string[] = [];
	const alreadySignedUp: string[] = [];
	for (const channelId of addsRequested) {
		if (await addVoiceChatUser(channelId, userId)) added.push(channelId);
		else alreadySignedUp.push(channelId);
	}
	const removed: string[] = [];
	const notSignedUp: string[] = [];
	for (const channelId of removesRequested) {
		if (await removeVoiceChatUser(channelId, userId)) removed.push(channelId);
		else notSignedUp.push(channelId);
	}

	const parts = [
		...(added.length > 0
			? [`Signed up for ${joinWithAnd(added.map(mentionChannel))}`]
			: []),
		...(alreadySignedUp.length > 0
			? [
					`You are already signed up for ${joinWithAnd(alreadySignedUp.map(mentionChannel))}`,
				]
			: []),
		...(removed.length > 0
			? [
					`You will no longer be rung for ${joinWithAnd(removed.map(mentionChannel))}`,
				]
			: []),
		...(notSignedUp.length > 0
			? [
					`You aren't signed up for ${joinWithAnd(notSignedUp.map(mentionChannel))}`,
				]
			: []),
	];
	const changed = added.length > 0 || removed.length > 0;
	return flashRedirect(
		PANEL,
		parts.length > 0 ? parts.join(". ") : "No changes to your signups",
		changed ? "success" : "warn",
		{ page: query.get("page") ?? "0" },
	);
};

const noPermissionRender = (router: Parameters<Handler<"GET">>[0]) => ({
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

// stable ordering for paging: by role name, then channel name
const sortedRoleSignups = async (guild: Guild) => {
	const nameOf = (roleId: string, channelId: string) =>
		`${guild.roles.cache.get(roleId)?.name ?? roleId} ${guild.channels.cache.get(channelId)?.name ?? channelId}`;
	return (await getVoiceChatRoleSignups(guildVoiceChannelIds(guild))).sort(
		(a, b) =>
			nameOf(a.roleId, a.channelId).localeCompare(
				nameOf(b.roleId, b.channelId),
			),
	);
};

const rolesGet: Handler<"GET"> = async (router, interaction, state) => {
	const guild = interaction.guild;
	if (!guild)
		return { ...guildOnlyRender, components: [row(homeButton(router))] };
	if (!canManageRoleSignups(interaction)) return noPermissionRender(router);

	const mappings = await sortedRoleSignups(guild);
	const pageStrings = mappings.map(
		({ roleId, channelId }) => `${roleId}:${channelId}`,
	);
	const { pageItems, page, pageCount } = paginate(
		pageStrings,
		state.queryParams.get("page"),
	);

	const mappingLines =
		pageItems.length > 0
			? pageItems
					.map((pair) => {
						const [roleId = "", channelId = ""] = pair.split(":");
						return `${mentionRole(roleId)} → ${mentionChannel(channelId)}`;
					})
					.join("\n")
			: "None yet";
	const description = withFlash(
		state.queryParams,
		"When someone joins a channel, its signed-up roles get pinged.\n\n" +
			`**Role signups${pageCount > 1 ? ` (page ${page + 1} of ${pageCount})` : ""}:**\n${mappingLines}`,
	);

	const removeOptions = pageItems.map((pair) => {
		const [roleId = "", channelId = ""] = pair.split(":");
		return new RouteStringSelectMenuOptionBuilder(router)
			.setLabel(
				`@${guild.roles.cache.get(roleId)?.name ?? roleId} → #${guild.channels.cache.get(channelId)?.name ?? channelId}`,
			)
			.setTo(`${ROLES}/remove`, { queryParams: { pair } });
	});

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("Role signups")
				.setDescription(description),
		],
		components: [
			...(removeOptions.length > 0
				? [
						new ActionRowBuilder<RouteStringSelectMenuBuilder>()
							.addComponents(
								new RouteStringSelectMenuBuilder(router)
									.setTos(...removeOptions)
									.setPlaceholder("Remove role signups")
									.setMinValues(1)
									.setMaxValues(removeOptions.length)
									.setPattern(`${ROLES}/remove`, {
										method: "POST",
										queryParams: { page: String(page) },
									}),
							)
							.toJSON(),
					]
				: []),
			new ActionRowBuilder<RouteRoleSelectMenuBuilder>()
				.addComponents(
					new RouteRoleSelectMenuBuilder(router)
						.setMinValues(1)
						.setMaxValues(1)
						.setPlaceholder("Add a role signup: pick a role")
						.setPattern(`${ROLES}/:roleId`),
				)
				.toJSON(),
			row(backButton(router, PANEL), homeButton(router)),
			...paginationRows(router, ROLES, { page, pageCount }),
		],
	};
};

// a remove-select value decodes to "<path>?pair=<roleId>:<channelId>"
const pairOf = (
	value: string,
): { roleId: string; channelId: string } | null => {
	const [, query = ""] = value.split("?");
	const [roleId, channelId] =
		new URLSearchParams(query).get("pair")?.split(":") ?? [];
	return roleId && channelId ? { roleId, channelId } : null;
};

// serves the panel's remove select and the /unsignuprole adapter (role and
// optional channel as query params; no channel removes the role everywhere)
const rolesRemovePost: Handler<"POST"> = async (router, interaction, state) => {
	const guild = interaction.guild;
	if (!guild)
		return flashRedirect(
			ROLES,
			"Signups only work inside a Discord server",
			"warn",
		);
	if (!canManageRoleSignups(interaction))
		return flashRedirect(
			ROLES,
			"You need the Manage Roles permission to manage role signups",
			"warn",
		);

	const query = state.queryParams;
	let pairs: { roleId: string; channelId: string }[];
	if (state.values) {
		pairs = state.values
			.map(pairOf)
			.filter((pair): pair is NonNullable<typeof pair> => pair !== null);
	} else {
		const roleId = query.get("role") ?? "";
		const channelId = query.get("channel");
		pairs = channelId
			? [{ roleId, channelId }]
			: (await sortedRoleSignups(guild)).filter(
					(mapping) => mapping.roleId === roleId,
				);
		if (pairs.length === 0)
			return flashRedirect(
				ROLES,
				`${mentionRole(roleId)} isn't signed up for any voice channel`,
				"warn",
			);
	}

	const removed: typeof pairs = [];
	const missing: typeof pairs = [];
	for (const pair of pairs) {
		if (await removeVoiceChatRole(pair.channelId, pair.roleId))
			removed.push(pair);
		else missing.push(pair);
	}

	const describe = (list: typeof pairs) =>
		joinWithAnd(
			list.map(
				({ roleId, channelId }) =>
					`${mentionRole(roleId)} from ${mentionChannel(channelId)}`,
			),
		);
	const parts = [
		...(removed.length > 0 ? [`Removed ${describe(removed)}`] : []),
		...(missing.length > 0 ? [`Already removed: ${describe(missing)}`] : []),
	];
	return flashRedirect(
		ROLES,
		parts.length > 0 ? parts.join(". ") : "No role signups to remove",
		removed.length > 0 ? "success" : "warn",
		{ page: query.get("page") ?? "0" },
	);
};

const rolePickGet: Handler<"GET"> = async (router, interaction, state) => {
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

const roleCommitPost: Handler<"POST"> = async (router, interaction, state) => {
	if (!canManageRoleSignups(interaction))
		return flashRedirect(
			ROLES,
			"You need the Manage Roles permission to manage role signups",
			"warn",
		);

	const roleId =
		typeof state.params.roleId === "string" ? state.params.roleId : "";
	const channelId = state.queryParams.get("channel") ?? "";
	const channel = interaction.guild?.channels.cache.get(channelId);
	if (!channel?.isVoiceBased())
		return flashRedirect(
			`${ROLES}/${roleId}`,
			"Pick a voice channel to finish the role signup",
			"warn",
		);

	const added = await addVoiceChatRole(channelId, roleId);
	return added
		? flashRedirect(
				ROLES,
				`Signed up ${mentionRole(roleId)} for ${mentionChannel(channelId)}`,
				"success",
			)
		: flashRedirect(
				ROLES,
				`${mentionRole(roleId)} is already signed up for ${mentionChannel(channelId)}`,
				"warn",
			);
};

export const signupsHandlers = {
	panel: { get: panelGet } satisfies Handlers,
	members: { post: membersPost } satisfies Handlers,
	roles: { get: rolesGet } satisfies Handlers,
	rolesRemove: { post: rolesRemovePost } satisfies Handlers,
	rolePage: { get: rolePickGet, post: roleCommitPost } satisfies Handlers,
};
