import { User } from "discord.js";
import { WatcherMap } from "../storage/watcher-map";
import { DiscordUser } from "./discord-user";

// both used to notify data.js
export const voiceChatOnModifyFunctions: (() => void)[] = [];
const onModify = () => {
	for (let i = 0; i < voiceChatOnModifyFunctions.length; i ++)
		voiceChatOnModifyFunctions[i]?.();
};

// class for a discord voice chat
export class VoiceChat {
	static voiceChats: WatcherMap<string, VoiceChat> = new WatcherMap(onModify, null);

	// returns if the voice chat is the default, in which case we don't need to store it
	static isDefault(
		userIds: WatcherMap<string, null> = new WatcherMap(onModify, null),
		roleIds: WatcherMap<string, null> = new WatcherMap(onModify, null)
	) {
		return userIds.size === 0 && roleIds.size === 0;
	}

	private channelId: string;
	private userIds: WatcherMap<string, null>; // the value doesn't actually matter
	private roleIds: WatcherMap<string, null>; // role IDs to ping

	public getChannelId() { return this.channelId; }
	public getUserIds() { return this.userIds; }
	public getRoleIds() { return this.roleIds; }

	/*
		channel is the channel object
		userIds is an array of userIds
		roleIds is an array of roleIds
	*/
	constructor (
		channelId: string,
		userIds: WatcherMap<string, null> | Iterable<string> = new WatcherMap(onModify, null),
		roleIds: WatcherMap<string, null> | Iterable<string> = new WatcherMap(onModify, null)
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
	addUser (userId: string) {
		// update userIds
		this.userIds.set(userId, null); // the value doesn't actually matter
	}

	// removes a user
	removeUser (userId: string) {
		this.userIds.delete(userId);

		DiscordUser.users.get(userId)?.removeFilter(this.channelId);

		// delete object if no users and no roles
		if (this.userIds.size === 0 && this.roleIds.size === 0)
			VoiceChat.voiceChats.delete(this.channelId);
	}

	// returns if it has the user
	hasUser (userId: string) {
		return this.userIds.has(userId);
	}

	// add a role
	addRole (roleId: string) {
		this.roleIds.set(roleId, null);
	}

	// removes a role
	removeRole (roleId: string) {
		this.roleIds.delete(roleId);

		// delete object if no users and no roles
		if (this.userIds.size === 0 && this.roleIds.size === 0)
			VoiceChat.voiceChats.delete(this.channelId);
	}

	// returns if it has the role
	hasRole (roleId: string) {
		return this.roleIds.has(roleId);
	}

	// helper to convert role id to mention string
	static roleToString(roleId: string) {
		return `<@&${roleId}>`;
	}

	// on someone joining a call
	// user is the person who just joined the call
	async onJoin (ringerUser: User) {
		// if the channel cache does not contain the channel 
		if (!ringerUser.client.channels.resolve(this.channelId))
			await ringerUser.client.channels.fetch(this.channelId);
		
		const channel = ringerUser.client.channels.resolve(this.channelId);
		if (!channel?.isVoiceBased()) return;
		
		const ringerDiscordUser = DiscordUser.users.get(ringerUser.id);
		// if user is in stealth mode, don't send message
		if (ringerDiscordUser && ringerDiscordUser.getRealMode(channel) === "stealth") return;

		// Collect roles to ping - only ping a role if no one else in the channel has it
		// (similar to how individual pings only happen when someone "starts" a call)
		const roleMemberIds = new Set<string>();
		const roleIdsToRing: string[] = [];
		for (const roleId of this.roleIds.keys()) {
			const role = channel.guild.roles.resolve(roleId);
			if (role) {
				// Check if any existing member in the channel (besides the one who just joined) has triggered a ping
				let roleHasBeenPinged = false;
				for (const [memberId] of channel.members) {
					if (memberId === ringerUser.id) continue; // skip the person who just joined
					
					// Check if they're in stealth mode
					const memberDiscordUser = DiscordUser.users.get(memberId);
					if (!memberDiscordUser || memberDiscordUser.getRealMode(channel) !== "stealth") {
						roleHasBeenPinged = true;
						break;
					}
				}
				
				// Only ping this role if it has not already been pinged
				if (!roleHasBeenPinged) {
					roleIdsToRing.push(roleId);
				}
				// Always collect role members for duplicate ping prevention
				role.members.forEach(member => roleMemberIds.add(member.id));
			}
		}

		const userIdsToRing: string[] = Array.from(this.userIds.keys()).filter(ringeeUserId => {
			try {
				// if ring is valid
				DiscordUser.validateRing(channel, ringerUser.id, ringeeUserId);

				// Skip this user if they will be pinged via a role (prevent duplicate pings)
				if (roleMemberIds.has(ringeeUserId)) {
					return false;
				}

				let onlyOnePersonPassing = true;
				// check if anyone else in the call passes the filter of the person joining
				for (const userId of channel.members.keys()) {
					if (userId === ringerUser.id) continue;
					
					try {
						DiscordUser.validateRing(channel, userId, ringeeUserId);

						if (DiscordUser.users.get(userId)?.getRealMode(channel) !== "stealth") {
							onlyOnePersonPassing = false;
							break;
						}
					} catch { /* do nothing */ }
				}
				
				return onlyOnePersonPassing;
			} catch {
				return false;
			}
		});

		// Build the mentions list (users first, then roles)
		const mentions: string[] = [
			...userIdsToRing.map(userId => DiscordUser.toString(userId)),
			...roleIdsToRing.map(roleId => VoiceChat.roleToString(roleId))
		];

		if (mentions.length > 0) {
			const mentionsText = mentions.length >= 2
				? `${mentions.slice(0, mentions.length - 1).join(", ")} and ${mentions[mentions.length - 1]}`
				: mentions[0];

			await channel.send({
				content: `\`@${channel.guild.members.resolve(ringerUser.id)?.displayName}\` just joined \`#${channel.name}\`, ${mentionsText}`,
				allowedMentions: { users: userIdsToRing, roles: roleIdsToRing }
			});
		}
	}
}
