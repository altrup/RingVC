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
	static isDefault(userIds: string[]) {
		return Array.from(userIds).length === 0;
	}

	private channelId: string;
	private userIds: WatcherMap<string, null>; // the value doesn't actually matter

	public getChannelId() { return this.channelId; }
	public getUserIds() { return this.userIds; }

	/*
		channel is the channel object
		userIds is an array of userIds
		if skipUserUpdates is true, then this class will NEVER make new users or change existing ones
			Only used when loading from data.js, because the users already exist with data
	*/
	constructor (channelId: string, userIds: string[], skipUserUpdates: boolean = false) {
		// update channel map
		VoiceChat.voiceChats.set(channelId, this);

		this.channelId = channelId;
		this.userIds = new WatcherMap(onModify, null);
		let userIdsArray = Array.from(userIds);
		for (const userId of userIdsArray)
			this.addUser(userId, skipUserUpdates);
	}

	// add a user
	addUser (userId: string, skipUserUpdates: boolean = false) {
		if (!skipUserUpdates) {
			const discordUser = DiscordUser.users.get(userId);
			if (discordUser) {
				// update discord user
				discordUser.addVoiceChannel(this.channelId);
			} else {
				// create new discord user if needed
				new DiscordUser(userId);
			}
		}

		// update userIds
		this.userIds.set(userId, null); // the value doesn't actually matter
	}

	// removes a user
	removeUser (userId: string) {
		this.userIds.delete(userId);

		DiscordUser.users.get(userId)?.removeVoiceChannel(this.channelId);

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
	async onJoin (startedUser?: User) {
		if (!startedUser) return;
		
		// if the channel cache does not contain the channel 
		if (!startedUser.client.channels.resolve(this.channelId))
			await startedUser.client.channels.fetch(this.channelId);
		
		const channel = startedUser.client.channels.resolve(this.channelId);
		if (!channel?.isVoiceBased()) return;
		
		const startedDiscordUser = DiscordUser.users.get(startedUser.id);
		// if user is in stealth mode, don't send message
		if (startedDiscordUser && startedDiscordUser.getRealMode(channel) === "stealth")
			return;

		Promise.allSettled(
			Array.from(this.userIds.keys()).map(key => new Promise<DiscordUser>((resolve, reject) => {
				const discordUser = DiscordUser.users.get(key);
				if (!discordUser) { return reject("User does not exist"); }
				discordUser.shouldRing(channel, startedUser).then(async () => {
					if (discordUser.filter(
						startedDiscordUser?.getFilter(channel.id), 
						discordUser.filter(discordUser.getFilter(channel.id), Array.from(channel.members.keys()))
					).filter(userId => {
						return DiscordUser.users.get(userId)?.getRealMode(channel) !== "stealth";
					}).length === 1) { // if the user is the only person who passes the filter
						resolve(discordUser);
					} else {
						reject("User has already been pinged for this call");
					}
				}).catch((error) => {
					reject(error);
				});
			}))
		).then((results) => {
			const filterResults = results.filter(result => result.status === "fulfilled").map(result => result.value);
			if (filterResults.length > 0)
				channel.send({
					content: `\`@${channel.guild.members.resolve(startedUser.id)?.displayName}\` just joined \`#${channel.name}\`, ${
						filterResults.length >= 2?
							`${filterResults.slice(0, filterResults.length - 1).join(", ")} and ${filterResults[filterResults.length - 1]}`
						: `${filterResults[0]}`
					}`,
					allowedMentions: {users: filterResults.map(value => value.getUserId())}
				})
				.catch(() => {}); // do nothing for now (discord permission error)
		});
	}
}
