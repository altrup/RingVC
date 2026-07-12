import {
	DiscordAPIError,
	PermissionsBitField,
	User,
	VoiceBasedChannel,
} from "discord.js";

import { isAutoRingEnabled } from "@db/auto-ring";
import { getAllDefaultRingees } from "@db/default-ringees";
import {
	getFiltersForUsers,
	passesUserFilters,
	UserFilters,
} from "@db/filters";
import { DiscordUserMode, getUserModes } from "@db/users";
import { getVoiceChatSignups } from "@db/voice-chats";

export const mentionUser = (userId: string) => `<@${userId}>`;
export const mentionRole = (roleId: string) => `<@&${roleId}>`;

export const joinWithAnd = (list: string[]): string => {
	return list.length >= 2
		? `${list.slice(0, list.length - 1).join(", ")} and ${list[list.length - 1]}`
		: (list[0] ?? "");
};

export const getErrorMessage = (err: unknown) => {
	if (err instanceof Error) return err.message;
	if (err instanceof DiscordAPIError) {
		if ("message" in err.rawError && typeof err.rawError.message === "string")
			return err.rawError.message;
		else if ("error" in err.rawError && typeof err.rawError.error === "string")
			return err.rawError.error;
	}
	return "";
};

// resolves "auto" to stealth when the user appears offline
export const getRealMode = (
	mode: DiscordUserMode,
	channel: VoiceBasedChannel,
	userId: string,
): "normal" | "stealth" => {
	if (mode === "auto") {
		const member = channel.guild.members.resolve(userId);
		if (member && member.presence && member.presence.status === "offline")
			return "stealth";
		return "normal";
	}
	return mode;
};

export type UserRingResult =
	| {
			userId: string;
			status: "fulfilled";
	  }
	| {
			userId: string;
			status: "rejected";
			error: Error;
	  };

/*
 * channel: discordjs object of the channel the person is in
 * ringerUserId: id of the person who started the call / command
 * ringeeUserId: id of the person who is being invited
 * filters: prefetched filters for (at least) both users, from getFiltersForUsers
 *
 * returns if the ring is allowed, throws with the reason otherwise
 */
export const validateRing = (
	channel: VoiceBasedChannel,
	ringerUserId: string,
	ringeeUserId: string,
	filters: Map<string, UserFilters>,
) => {
	// if both users are the same
	if (ringerUserId === ringeeUserId) throw new Error(`you can't ring yourself`);
	// if user can't join channel
	if (
		!channel
			.permissionsFor(ringeeUserId)
			?.has(PermissionsBitField.Flags.Connect)
	)
		throw new Error(`${mentionUser(ringeeUserId)} can't join ${channel}`);
	// if this user is already in the voice chat
	if (channel.members.has(ringeeUserId))
		throw new Error(`${mentionUser(ringeeUserId)} is already in ${channel}`);
	// if the ringer has blocked the ringee
	if (!passesUserFilters(filters.get(ringerUserId), ringeeUserId))
		throw new Error(`you blocked ${mentionUser(ringeeUserId)}`);
	// if the ringee has blocked the ringer
	if (!passesUserFilters(filters.get(ringeeUserId), ringerUserId))
		throw new Error(`${mentionUser(ringeeUserId)} blocked you`);
};

// sends a message pinging the ringees for whom validateRing passes.
// returns a result per ringee; throws if the ping message fails to send
export const ring = async (
	channel: VoiceBasedChannel,
	ringerUserId: string,
	message: string,
	ringeeUserIds: string[],
): Promise<UserRingResult[]> => {
	const filters = await getFiltersForUsers(
		[ringerUserId, ...ringeeUserIds],
		channel.id,
	);

	const results: UserRingResult[] = [];
	const userIdsToRing: string[] = [];
	for (const ringeeUserId of ringeeUserIds) {
		try {
			validateRing(channel, ringerUserId, ringeeUserId, filters);
			results.push({ userId: ringeeUserId, status: "fulfilled" });
			userIdsToRing.push(ringeeUserId);
		} catch (err) {
			results.push({
				userId: ringeeUserId,
				status: "rejected",
				error: new Error(getErrorMessage(err)),
			});
		}
	}

	const mentions = userIdsToRing.map(mentionUser);

	try {
		if (mentions.length > 0) {
			await channel.send({
				content: `\`@${channel.guild.members.resolve(ringerUserId)?.displayName}\` ${message} \`#${channel.name}\`, ${joinWithAnd(mentions)}`,
				allowedMentions: { users: userIdsToRing },
			});
		}
		return results;
	} catch (err) {
		throw new Error(
			`the ring message ${userIdsToRing.length === 1 ? `to ${userIdsToRing[0]} ` : ``}failed to send: \`${getErrorMessage(err)}\``,
		);
	}
};

// rings the user's default ringees (global + channel); throws if there are none
export const ringDefaultUsers = async (
	channel: VoiceBasedChannel,
	userId: string,
	message: string,
): Promise<UserRingResult[]> => {
	const ringeeUserIds = await getAllDefaultRingees(userId, channel.id);
	if (ringeeUserIds.length === 0) {
		throw new Error(`no default users to ring`);
	}

	return ring(channel, userId, message, ringeeUserIds);
};

// pings this channel's signed-up users and roles when someone joins.
// doesn't use ring(); that's only for rings from commands
const ringSignups = async (channel: VoiceBasedChannel, ringerUser: User) => {
	const { userIds: signedUpUserIds, roleIds: signedUpRoleIds } =
		await getVoiceChatSignups(channel.id);
	if (signedUpUserIds.length === 0 && signedUpRoleIds.length === 0) return;

	const memberIds = [...channel.members.keys()];
	const [modes, filters] = await Promise.all([
		getUserModes([ringerUser.id, ...memberIds]),
		getFiltersForUsers(
			[...new Set([ringerUser.id, ...memberIds, ...signedUpUserIds])],
			channel.id,
		),
	]);
	const getMode = (userId: string) =>
		getRealMode(modes.get(userId) ?? "normal", channel, userId);

	// if user is in stealth mode, don't send message
	if (getMode(ringerUser.id) === "stealth") return;

	// Collect roles to ping - only ping a role if no one else in the channel has it
	// (similar to how individual pings only happen when someone "starts" a call)
	const roleIdsToRing: string[] = [];
	for (const roleId of signedUpRoleIds) {
		const role =
			channel.guild.roles.resolve(roleId) ??
			(await channel.guild.roles.fetch(roleId));
		if (!role) continue;

		// Check if any existing member in the channel (besides the one who just
		// joined) has triggered a ping
		let roleHasBeenPinged = false;
		for (const [memberId] of channel.members) {
			if (memberId === ringerUser.id) continue; // skip the person who just joined

			// Check if they're in stealth mode
			if (getMode(memberId) !== "stealth") {
				// role has already been pinged
				roleHasBeenPinged = true;
				break;
			}
		}
		if (roleHasBeenPinged) continue;

		roleIdsToRing.push(roleId);
	}

	const userIdsToRing: string[] = [];
	for (const ringeeUserId of signedUpUserIds) {
		try {
			// if ring is valid
			validateRing(channel, ringerUser.id, ringeeUserId, filters);

			let userHasBeenPinged = false;
			for (const userId of channel.members.keys()) {
				if (userId === ringerUser.id) continue;

				try {
					validateRing(channel, userId, ringeeUserId, filters);

					if (getMode(userId) !== "stealth") {
						userHasBeenPinged = true;
						break;
					}
				} catch {
					/* do nothing */
				}
			}
			if (userHasBeenPinged) continue;

			// Skip this user if they will be pinged via a role (prevent duplicate pings)
			const ringeeUser =
				channel.guild.members.resolve(ringeeUserId) ??
				(await channel.guild.members.fetch(ringeeUserId));
			if (
				signedUpRoleIds.some((roleId) => ringeeUser.roles.cache.has(roleId))
			) {
				continue;
			}

			userIdsToRing.push(ringeeUserId);
		} catch {
			continue;
		}
	}

	// Build the mentions list (users first, then roles)
	const mentions: string[] = [
		...userIdsToRing.map(mentionUser),
		...roleIdsToRing.map(mentionRole),
	];

	if (mentions.length > 0) {
		await channel.send({
			content: `\`@${channel.guild.members.resolve(ringerUser.id)?.displayName}\` just joined \`#${channel.name}\`, ${joinWithAnd(mentions)}`,
			allowedMentions: { users: userIdsToRing, roles: roleIdsToRing },
		});
	}
};

// on someone joining a voice channel: ping the channel's signups, and ring
// the joiner's default ringees if they have auto ring enabled
export const onVoiceChannelJoin = async (
	channel: VoiceBasedChannel,
	ringerUser: User,
) => {
	// unlike ringDefaultUsers, having no default ringees is not an error here:
	// joining with auto ring on and nothing configured is a normal state
	const autoRing = async () => {
		if (!(await isAutoRingEnabled(ringerUser.id, channel.id))) return;
		const ringeeUserIds = await getAllDefaultRingees(ringerUser.id, channel.id);
		if (ringeeUserIds.length === 0) return;
		await ring(channel, ringerUser.id, "wants you to join", ringeeUserIds);
	};

	await Promise.all([ringSignups(channel, ringerUser), autoRing()]);
};
