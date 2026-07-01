import { User, VoiceBasedChannel } from "discord.js";
import { WatcherMap } from "../storage/watcher-map";
import { DiscordUser } from "./discord-user";

// both used to notify data.js
export const voiceChatOnModifyFunctions: (() => void)[] = [];
const onModify = () => {
	for (let i = 0; i < voiceChatOnModifyFunctions.length; i++)
		voiceChatOnModifyFunctions[i]?.();
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

// class for a discord voice chat
export class VoiceChat {
	static voiceChats: WatcherMap<string, VoiceChat> = new WatcherMap(
		onModify,
		null,
	);

	// returns if the voice chat is the default, in which case we don't need to store it
	static isDefault(
		userIds: WatcherMap<string, null> = new WatcherMap(onModify, null),
		roleIds: WatcherMap<string, null> = new WatcherMap(onModify, null),
	) {
		return userIds.size === 0 && roleIds.size === 0;
	}

	// helper to convert role id to mention string
	static roleToString(roleId: string) {
		return `<@&${roleId}>`;
	}

	static joinWithAnd(list: string[]): string {
		return list.length >= 2
			? `${list
					.slice(0, list.length - 1)
					.join(", ")} and ${list[list.length - 1]}`
			: (list[0] ?? "");
	}

	// sends a message to ping the user(s), for whom validateRing passes
	// returns an array of error messages for users who didn't pass filter
	// throws an error if message failed to send
	static async ring(
		channel: VoiceBasedChannel,
		ringerUserId: string,
		message: string,
		ringeeUserIds: string[],
	): Promise<UserRingResult[]> {
		const failureReasons: UserRingResult[] = [];
		const userIdsToRing: string[] = [];
		ringeeUserIds.forEach((ringeeUserId) => {
			try {
				DiscordUser.validateRing(channel, ringerUserId, ringeeUserId);
				failureReasons.push({
					userId: ringeeUserId,
					status: "fulfilled",
				});
				userIdsToRing.push(ringeeUserId);
			} catch (err) {
				failureReasons.push({
					userId: ringeeUserId,
					status: "rejected",
					error: new Error(DiscordUser.getErrorMessage(err)),
				});
			}
		});

		// Build the mentions list (users first, then roles)
		const mentions: string[] = userIdsToRing.map((userId) =>
			DiscordUser.toString(userId),
		);

		try {
			if (mentions.length > 0) {
				await channel.send({
					content: `\`@${channel.guild.members.resolve(ringerUserId)?.displayName}\` ${message} \`#${channel.name}\`, ${VoiceChat.joinWithAnd(
						mentions,
					)}`,
					allowedMentions: { users: userIdsToRing },
				});
			}
			return failureReasons;
		} catch (err) {
			throw new Error(
				`the ring message ${userIdsToRing.length === 1 ? `to ${userIdsToRing[0]} ` : ``}failed to send: \`${DiscordUser.getErrorMessage(err)}\``,
			);
		}
	}

	private channelId: string;
	private userIds: WatcherMap<string, null>; // the value doesn't actually matter
	private roleIds: WatcherMap<string, null>; // role IDs to ping

	public getChannelId() {
		return this.channelId;
	}
	public getUserIds() {
		return this.userIds;
	}
	public getRoleIds() {
		return this.roleIds;
	}

	/*
		channel is the channel object
		userIds is an array of userIds
		roleIds is an array of roleIds
	*/
	constructor(
		channelId: string,
		userIds: WatcherMap<string, null> | Iterable<string> = new WatcherMap(
			onModify,
			null,
		),
		roleIds: WatcherMap<string, null> | Iterable<string> = new WatcherMap(
			onModify,
			null,
		),
	) {
		// update channel map
		VoiceChat.voiceChats.set(channelId, this);

		this.channelId = channelId;
		this.userIds = new WatcherMap(onModify, null);
		if (userIds instanceof WatcherMap) {
			this.userIds = userIds;
		} else {
			for (const userId of userIds) {
				this.userIds.set(userId, null);
			}
		}
		this.roleIds = new WatcherMap(onModify, null);
		if (roleIds instanceof WatcherMap) {
			this.roleIds = roleIds;
		} else {
			for (const roleId of roleIds) {
				this.roleIds.set(roleId, null);
			}
		}
	}

	// add a user
	addUser(userId: string) {
		// update userIds
		this.userIds.set(userId, null); // the value doesn't actually matter
	}

	// removes a user
	removeUser(userId: string): boolean {
		const removedUser = this.userIds.delete(userId);

		DiscordUser.users.get(userId)?.removeFilter(this.channelId);

		// delete object if no users and no roles
		if (this.userIds.size === 0 && this.roleIds.size === 0)
			VoiceChat.voiceChats.delete(this.channelId);

		return removedUser;
	}

	// returns if it has the user
	hasUser(userId: string) {
		return this.userIds.has(userId);
	}

	// add a role
	addRole(roleId: string) {
		this.roleIds.set(roleId, null);
	}

	// removes a role
	removeRole(roleId: string) {
		this.roleIds.delete(roleId);

		// delete object if no users and no roles
		if (this.userIds.size === 0 && this.roleIds.size === 0)
			VoiceChat.voiceChats.delete(this.channelId);
	}

	// returns if it has the role
	hasRole(roleId: string) {
		return this.roleIds.has(roleId);
	}

	// on someone joining a call
	// user is the person who just joined the call
	// doesn't use ring function; that's only for rings from commands
	async onJoin(ringerUser: User) {
		const channel =
			ringerUser.client.channels.resolve(this.channelId) ??
			(await ringerUser.client.channels.fetch(this.channelId));
		if (!channel?.isVoiceBased()) return;

		const ringerDiscordUser = DiscordUser.users.get(ringerUser.id);
		// if user is in stealth mode, don't send message
		if (
			ringerDiscordUser &&
			ringerDiscordUser.getRealMode(channel) === "stealth"
		)
			return;

		// Collect roles to ping - only ping a role if no one else in the channel has it
		// (similar to how individual pings only happen when someone "starts" a call)
		const roleIdsToRing: string[] = [];
		for (const roleId of this.roleIds.keys()) {
			const role =
				channel.guild.roles.resolve(roleId) ??
				(await channel.guild.roles.fetch(roleId));
			if (!role) continue;

			// Check if any existing member in the channel (besides the one who just joined) has triggered a ping
			let roleHasBeenPinged = false;
			for (const [memberId] of channel.members) {
				if (memberId === ringerUser.id) continue; // skip the person who just joined

				// Check if they're in stealth mode
				const memberDiscordUser = DiscordUser.users.get(memberId);
				if (
					!memberDiscordUser ||
					memberDiscordUser.getRealMode(channel) !== "stealth"
				) {
					// role has already been pinged
					roleHasBeenPinged = true;
					break;
				}
			}
			if (roleHasBeenPinged) continue;

			roleIdsToRing.push(roleId);
		}

		const userIdsToRing: string[] = [];
		for (const ringeeUserId of this.userIds.keys()) {
			try {
				// if ring is valid
				DiscordUser.validateRing(channel, ringerUser.id, ringeeUserId);

				let userHasBeenPinged = false;
				for (const userId of channel.members.keys()) {
					if (userId === ringerUser.id) continue;

					try {
						DiscordUser.validateRing(channel, userId, ringeeUserId);

						if (
							DiscordUser.users.get(userId)?.getRealMode(channel) !== "stealth"
						) {
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
					[...this.roleIds.keys()].some((roleId) =>
						ringeeUser.roles.cache.has(roleId),
					)
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
			...userIdsToRing.map((userId) => DiscordUser.toString(userId)),
			...roleIdsToRing.map((roleId) => VoiceChat.roleToString(roleId)),
		];

		if (mentions.length > 0) {
			await channel.send({
				content: `\`@${channel.guild.members.resolve(ringerUser.id)?.displayName}\` just joined \`#${channel.name}\`, ${VoiceChat.joinWithAnd(mentions)}`,
				allowedMentions: { users: userIdsToRing, roles: roleIdsToRing },
			});
		}
	}
}
