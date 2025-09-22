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
	static isDefault(userIds: WatcherMap<string, null> = new WatcherMap(onModify, null)) {
		return userIds.size === 0;
	}

	private channelId: string;
	private userIds: WatcherMap<string, null>; // the value doesn't actually matter

	public getChannelId() { return this.channelId; }
	public getUserIds() { return this.userIds; }

	/*
		channel is the channel object
		userIds is an array of userIds
	*/
	constructor (channelId: string, userIds: WatcherMap<string, null> | Iterable<string> = new WatcherMap(onModify, null)) {
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

		// delete object if no users
		if (this.userIds.size == 0)
			VoiceChat.voiceChats.delete(this.channelId);
	}

	// returns if it has the user
	hasUser (userId: string) {
		return this.userIds.has(userId);
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
		// if user is in stealth mode, don't send messageringerUser
		if (ringerDiscordUser && ringerDiscordUser.getRealMode(channel) === "stealth") return;

		const userIdsToRing: string[] = Array.from(this.userIds.keys()).filter(ringeeUserId => {
			try {
				// if ring is valid
				DiscordUser.validateRing(channel, ringerUser.id, ringeeUserId);

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

		if (userIdsToRing.length > 0)
			await channel.send({
				content: `\`@${channel.guild.members.resolve(ringerUser.id)?.displayName}\` just joined \`#${channel.name}\`, ${
					userIdsToRing.length >= 2?
						`${userIdsToRing.slice(0, userIdsToRing.length - 1).map(userId => DiscordUser.toString(userId)).join(", ")} and ${DiscordUser.toString(userIdsToRing[userIdsToRing.length - 1]?? "")}`
					: `${DiscordUser.toString(userIdsToRing[0]?? "")}`
				}`,
				allowedMentions: {users: userIdsToRing}
			})
	}
}
