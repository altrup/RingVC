import { VoiceBasedChannel, PermissionsBitField, DiscordAPIError } from "discord.js";
import { WatcherMap } from "@main/classes/storage/watcher-map";
import { Filter } from "@main/classes/commands/filter";

// both used to notify data.js
export const userOnModifyFunctions: (() => void)[] = [];
const onModify = () => {
	for (let i = 0; i < userOnModifyFunctions.length; i ++)
		userOnModifyFunctions[i]?.();
};

export type DiscordUserMode = "normal" | "stealth" | "auto";
export const isDiscordUserMode = (mode: string): mode is DiscordUserMode => {
	return mode === "normal" || mode === "stealth" || mode === "auto";
};

// class that represents a discord user with it's filters and such
export class DiscordUser {
	static users = new WatcherMap<string, DiscordUser>(onModify, null);

	/*
		* channel: discordjs object of the channel the person is in
		* ringerUserId: id of the person who started the call / command
		* ringeeUserId: id of the person who is being invited
		* 
		* resolves if should ring, and rejects if not
		* 
		* returns if fine, throws error otherwise
	*/
	static validateRing(channel: VoiceBasedChannel, ringerUserId: string, ringeeUserId: string) {
		// if both users are the same
		if (ringerUserId === ringeeUserId)
			throw new Error(`you can't ring yourself`);
		// if user can't join channel
		if (!channel.permissionsFor(ringeeUserId)?.has(PermissionsBitField.Flags.Connect))
			throw new Error(`${DiscordUser.toString(ringeeUserId)} can't join ${channel}`);
		// if this user is already in the voice chat
		if (channel.members.has(ringeeUserId)) 
			throw new Error(`${DiscordUser.toString(ringeeUserId)} is already in ${channel}`);
		// if the ringer has blocked the ringee
		const ringerDiscordUser = DiscordUser.users.get(ringerUserId);
		if (ringerDiscordUser && !ringerDiscordUser.passesFilter(channel.id, ringeeUserId))
			throw new Error(`you blocked ${DiscordUser.toString(ringeeUserId)}`);
		// if the ringee has blocked the ringer
		const ringeeDiscordUser = DiscordUser.users.get(ringeeUserId);
		if (ringeeDiscordUser && !ringeeDiscordUser.passesFilter(channel.id, ringerUserId))
			throw new Error(`${DiscordUser.toString(ringeeUserId)} blocked you`);
	}
	// sends a message to ping the user, if validateRing passes
	static async ring(channel: VoiceBasedChannel, ringerUserId: string, message: string, userId: string) {
		DiscordUser.validateRing(channel, ringerUserId, userId);

		try {
			await channel.send({
				content: `\`@${channel.guild.members.resolve(ringerUserId)?.displayName}\` ${message} \`#${channel.name}\`, ${DiscordUser.toString(userId)}`,
				allowedMentions: {users: [userId]}
			});
		} catch (err) {
			throw new Error(`the ring message to ${DiscordUser.toString(userId)} failed to send${DiscordUser.getErrorMessage(err)}`);
		}
	}
	// helper functions
	static toString(userId: string) {
		return `<@${userId}>`;
	}
	static getErrorMessage(err: unknown) {
		if (err instanceof Error) return err.message;
		if (err instanceof DiscordAPIError) {
			if ("message" in err.rawError && typeof err.rawError.message === 'string')
				return err.rawError.message;
			else if ("error" in err.rawError && typeof err.rawError.error === 'string')
				return err.rawError.error;
		}
		return "";
	}

	// returns if user settings are the default, in which case we don't need to store them
	static isDefault(
		voiceChannels: WatcherMap<string, Filter> = new WatcherMap(onModify, null),
		globalFilter: Filter = new Filter(), 
		mode: string = "normal",
		channelAutoRingEnabled: WatcherMap<string, boolean> = new WatcherMap(onModify, null),
		globalAutoRingEnabled: boolean = false,
		defaultRingUserIds: WatcherMap<string, null> = new WatcherMap(onModify, null),
		globalDefaultRingUserIds: WatcherMap<string, null> = new WatcherMap(onModify, null)
	) {
		return (
			voiceChannels.size === 0 && 
			globalFilter.getList().size === 0 && 
			mode === "normal" && 
			channelAutoRingEnabled.size === 0 && 
			globalAutoRingEnabled === false &&
			defaultRingUserIds.size === 0 && 
			globalDefaultRingUserIds.size === 0
		);
	}

	private userId: string;
	private voiceChannelFilters: WatcherMap<string, Filter>;
	private globalFilter: Filter;
	private mode: DiscordUserMode;
	// channelId -> boolean
	private channelAutoRingEnabled: WatcherMap<string, boolean>;
	private globalAutoRingEnabled: boolean;
	// channelId -> userId -> null
	private channelDefaultRingeeUserIds: WatcherMap<string, WatcherMap<string, null>>;
	private globalDefaultRingeeUserIds: WatcherMap<string, null>;

	public getUserId() { return this.userId; }
	public getVoiceChannelFilters() { return this.voiceChannelFilters; }
	public getGlobalFilter() { return this.globalFilter; }
	public getMode() { return this.mode; }
	public getChannelAutoRingEnabled() { return this.channelAutoRingEnabled; }
	public getGlobalAutoRingEnabled() { return this.globalAutoRingEnabled; }
	public getChannelDefaultRingeeUserIds() { return this.channelDefaultRingeeUserIds; }
	public getGlobalDefaultRingeeUserIds() { return this.globalDefaultRingeeUserIds; }

	// voiceChannels is an array of channelID, Filter
	// defualtRingUserIds is an array of userIDs
	constructor (
		userId: string, 
		voiceChannels: WatcherMap<string, Filter> = new WatcherMap(onModify, null),
		globalFilter: Filter = new Filter(), 
		mode: DiscordUserMode = "normal", 
		channelAutoRingEnabled: WatcherMap<string, boolean> = new WatcherMap(onModify, null),
		globalAutoRingEnabled: boolean = false,
		defaultRingeeUserIds: WatcherMap<string, WatcherMap<string, null>> = new WatcherMap(onModify, null), 
		globalDefaultRingeeUserIds: WatcherMap<string, null> = new WatcherMap(onModify, null)
	) {
		// update userMap
		DiscordUser.users.set(userId, this);

		this.userId = userId;
		this.voiceChannelFilters = voiceChannels;
		this.globalFilter = globalFilter;
		this.mode = mode;
		this.channelAutoRingEnabled = channelAutoRingEnabled;
		this.globalAutoRingEnabled = globalAutoRingEnabled;
		this.channelDefaultRingeeUserIds = defaultRingeeUserIds;
		this.globalDefaultRingeeUserIds = globalDefaultRingeeUserIds;
	}

	// adds a voice channel
	// an optional filter object
	// returns filter object
	addFilter(channelId: string, filter?: Filter) {
		const newFilter = filter?? new Filter();
		this.voiceChannelFilters.set(
			channelId, newFilter
		);
		return newFilter;
	}

	// removes a voice channel filter
	removeFilter(channelId: string) {
		this.voiceChannelFilters.delete(channelId);
	}

	// if the user has signed up for a voice channel
	hasFilter(channelId: string) {
		return this.voiceChannelFilters.has(channelId);
	}

	// get the filter for a channelId
	// if channelId is null, return global filter
	getFilter(channelId: string): Filter | undefined;
	getFilter(channelId?: null): Filter;
	getFilter(channelId?: string | null) {
		if (channelId)
			return this.voiceChannelFilters.get(channelId);
		return this.globalFilter;
	}

	// whether or not a user passes the filter (and global filter)
	passesFilter(channelId: string, userId: string) {
		const filter = this.voiceChannelFilters.get(channelId);
		// if filter doesn't exist, it passes
		return (!filter || filter.passesFilter(userId)) && this.globalFilter.passesFilter(userId);
	}

	// needs channel to check if user is invisible
	getRealMode(channel: VoiceBasedChannel) {
		// if mode is auto, check if user is invisible
		if (this.mode === "auto") {
			const user = channel.guild.members.resolve(this.userId);
			if (user && user.presence && user.presence.status === "offline") 
				return "stealth";
			return "normal";
		}
		return this.mode;
	}
	setMode(mode: string | undefined | null) {
		// only normal, stealth, and auto are valid modes
		if (mode !== "normal" && mode !== "stealth" && mode !== "auto") return;
		// if mode doesn't change, don't do anything
		if (this.mode === mode) return;

		this.mode = mode;

		onModify();
	}

	isAutoRingEnabled(channelId: string | undefined): boolean {
		if (channelId !== undefined && this.channelAutoRingEnabled.has(channelId)) {
			return this.channelAutoRingEnabled.get(channelId)?? false;
		}
		return this.globalAutoRingEnabled;
	}
	// returns whether or not the value changed
	setAutoRingEnabled(channelId: string | undefined, enabled: boolean): boolean {
		if (channelId === undefined) {
			if (this.globalAutoRingEnabled === enabled) return false;
			
			this.globalAutoRingEnabled = enabled;
			onModify();
			return true;
		}

		if (this.channelAutoRingEnabled.get(channelId) === enabled) return false;

		this.channelAutoRingEnabled.set(channelId, enabled);
		onModify();
		return true;
	}

	// if channelId is undefined, then default to global default ring
	getDefaultRingeeUserIds(channelId: string | undefined): WatcherMap<string, null> | undefined;
	getDefaultRingeeUserIds(channelId?: undefined): WatcherMap<string, null>;
	getDefaultRingeeUserIds(channelId: string | undefined) {
		if (channelId === undefined) {
			return this.globalDefaultRingeeUserIds;
		}
		return this.channelDefaultRingeeUserIds.get(channelId);
	}
	// returns all global and channel specific default ring user ids
	getAllDefaultRingeeUserIds(channelId: string | undefined) {
		return [
			...this.globalDefaultRingeeUserIds.keys(),
			...(channelId? this.channelDefaultRingeeUserIds.get(channelId)?.keys()?? []: [])
		];
	}
	// adds a userId to a default ring list, returns true if added, false if already there
	addDefaultRingeeUserId(channelId: string | undefined, userId: string): boolean {
		if (!channelId) {
			this.globalDefaultRingeeUserIds.set(userId, null);
			return true;
		}
		const newList = this.channelDefaultRingeeUserIds.get(channelId) ?? new WatcherMap<string, null>(onModify, null);
		if (newList.has(userId)) return false;
		// add user to list
		newList.set(userId, null);
		if (!this.channelDefaultRingeeUserIds.has(channelId)) {
			this.channelDefaultRingeeUserIds.set(channelId, newList);
		}
		return true;
	}
	// removes a userId from a default ring list, returns true if removed, false if not there
	removeDefaultRingeeUserId(channelId: string | undefined, userId: string): boolean {
		if (!channelId) {
			return this.globalDefaultRingeeUserIds.delete(userId);
		}
		const list = this.channelDefaultRingeeUserIds.get(channelId);
		if (list) {
			const result = list.delete(userId);
			if (list.size === 0) {
				this.channelDefaultRingeeUserIds.delete(channelId);
			}
			return result;
		}
		return false;
	}
	// removes all users from a default ring list, returns true if removed, false if already empty
	clearDefaultRingeeUserIds(channelId: string | undefined): boolean {
		if (!channelId) {
			if (this.globalDefaultRingeeUserIds.size === 0) return false;
			this.globalDefaultRingeeUserIds.clear();
		} else {
			if (this.channelDefaultRingeeUserIds.get(channelId)?.size === 0) {
				this.channelDefaultRingeeUserIds.delete(channelId);
			}
			if (!this.channelDefaultRingeeUserIds.has(channelId)) return false;
			this.channelDefaultRingeeUserIds.delete(channelId);
		}
		return true;
	}

	getDefaultUserIdsToRing(channel: VoiceBasedChannel) {
		return this.getAllDefaultRingeeUserIds(channel.id).map(ringeeUserId => {
			try {
				DiscordUser.validateRing(channel, this.userId, ringeeUserId)

				return ringeeUserId;
			} catch {
				return null;
			}
		}).filter(result => result !== null);
	}
	async ringDefaultUsers(channel: VoiceBasedChannel, message: string) {
		if (this.getAllDefaultRingeeUserIds(channel.id).length === 0) {
			throw new Error(`no default users to ring`);
		}

		// ring each user that passes filters
		const userIdsToRing: string[] = this.getDefaultUserIdsToRing(channel);

		if (userIdsToRing.length > 0) {
			try {
				await channel.send({
					content: `\`@${channel.guild.members.resolve(this.userId)?.displayName}\` ${message} \`#${channel.name}\`, ${
						userIdsToRing.length >= 2?
							`${userIdsToRing.slice(0, userIdsToRing.length - 1).map(userId => DiscordUser.toString(userId)).join(", ")} and ${DiscordUser.toString(userIdsToRing[userIdsToRing.length - 1]?? "")}`
						: `${DiscordUser.toString(userIdsToRing[0]?? "")}`
					}`,
					allowedMentions: {users: userIdsToRing}
				})
			} catch (err) {
				throw new Error(`the ring message failed to send${DiscordUser.getErrorMessage(err)}`);
			}
		} else {
			throw new Error(`no default users for whom you passed each other's filters`);
		}
	}

	async onJoin(channel: VoiceBasedChannel) {
		// ringDefaultUsers if autoRingEnabled
		if (!this.isAutoRingEnabled(channel.id)) {
			return;
		}

		await this.ringDefaultUsers(channel, "wants you to join");
	}

	// returns a string that pings this discordUser
	toString() {
		return DiscordUser.toString(this.userId);
	}
}
