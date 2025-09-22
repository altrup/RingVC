import * as fs from 'fs';
import * as path from 'path';

// get setting
import { SAVE_COOLDOWN } from '@src/config';

// get classes
import { WatcherMap } from '@main/classes/storage/watcher-map';
import { DiscordUser, isDiscordUserMode, userOnModifyFunctions } from '@main/classes/commands/discord-user';
import { VoiceChat, voiceChatOnModifyFunctions } from '@main/classes/commands/voice-chat';
import { Filter, filterOnModifyFunctions } from '@main/classes/commands/filter';

const tempDataPath = path.join(process.cwd(), "data", "data.tmp.txt");
const dataPath = path.join(process.cwd(), "data", "data.txt");

// stolen from https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
const replacer = (key: string, value: unknown) => {
	if(value instanceof Map)
		return {
			dataType: 'Map',
			value: Array.from(value.entries()), // or with spread: value: [...value]
		};
	else if (value instanceof DiscordUser)
		return {
			dataType: 'DiscordUser',
			value: {
				userId: value.getUserId(),
				voiceChannels: value.getVoiceChannelFilters(),
				globalFilter: value.getGlobalFilter(),
				mode: value.getMode(),
				defaultRingeeUserIds: value.getChannelDefaultRingeeUserIds(),
				globalDefaultRingeeUserIds: value.getGlobalDefaultRingeeUserIds(),
			}
		};
	else if (value instanceof VoiceChat)
		return {
			dataType: 'VoiceChat',
			value: {
				channelId: value.getChannelId(),
				userIds: value.getUserIds()
			}
		};
	else if (value instanceof Filter)
		return {
			dataType: 'VoiceChannelFilter',
			value: {
				isWhitelist: value.getIsWhitelist(),
				list: value.getList()
			}
		};
	else
		return value;
};
const reviver = (key: string, rawValue: unknown) => {
	if (
		!rawValue || !(rawValue instanceof Object) || 
		!("dataType" in rawValue) || !("value" in rawValue) || 
		typeof rawValue.dataType !== 'string' || !(rawValue.value instanceof Object)
	) {
		return rawValue
	}

	const { dataType, value } = rawValue;
	if (dataType === 'Map' && Array.isArray(value))
		return value.reduce((map: WatcherMap<unknown, unknown>, object: [unknown, unknown]) => {
			map.set(object[0], object[1]);
			return map;
		}, new WatcherMap(onModify, null));
	else if (
		dataType === 'DiscordUser' && "userId" in value && typeof value.userId === 'string' &&
		"voiceChannels" in value && value.voiceChannels instanceof WatcherMap &&
		"globalFilter" in value && (value.globalFilter === undefined || value.globalFilter instanceof Filter) &&
		"mode" in value && typeof value.mode === 'string' && isDiscordUserMode(value.mode) &&
		"defaultRingeeUserIds" in value && value.defaultRingeeUserIds instanceof WatcherMap &&
		"globalDefaultRingeeUserIds" in value && value.globalDefaultRingeeUserIds instanceof WatcherMap
	) {
		if (value.userId && !DiscordUser.isDefault(value.voiceChannels, value.globalFilter, value.mode, value.defaultRingeeUserIds, value.globalDefaultRingeeUserIds))
			return new DiscordUser(value.userId, value.voiceChannels, value.globalFilter, value.mode, value.defaultRingeeUserIds, value.globalDefaultRingeeUserIds);
	}
	else if (
		dataType === 'VoiceChat' && "channelId" in value && typeof value.channelId === 'string' &&
		"userIds" in value && value.userIds instanceof WatcherMap
	) {
		if (!VoiceChat.isDefault(value.userIds))
			return new VoiceChat(value.channelId, value.userIds);
	}
	else if (
		dataType === 'VoiceChannelFilter' && "isWhitelist" in value && typeof value.isWhitelist === 'boolean' &&
		"list" in value && value.list instanceof WatcherMap
	)
		return new Filter(value.isWhitelist, value.list);
	
	return rawValue;
};

// whether or not data has been updated
let updated = false;

let lastSave = new Date();
let timeout: NodeJS.Timeout; // used to store timeout for saving during cooldown
let saved: Promise<void>; // a promise that resolves when data is saved
const saveData = (): Promise<void> => {
	return new Promise((resolve, reject) => {
		// update variables
		lastSave = new Date();
		updated = false;

		console.log("DO NOT QUIT!!! saving ...");

		fs.writeFile(tempDataPath, JSON.stringify(data, replacer), (err) => {
			if (err) {
				console.log("error saving data to temp file");
				reject(err);
				return;
			}
			
			fs.rename(tempDataPath, dataPath, (err) => {
				if (err) {
					console.log("error renaming temp file");
					reject(err);
					return;
				}
				console.log("data saved. YOU MAY NOW QUIT");
				resolve();
			});
		});
	});
};
const onModify = () => {
	// if it is already updated, then we don't need to do anything
	if (!updated) {
		updated = true;
		if (new Date().getTime() - lastSave.getTime() >= SAVE_COOLDOWN * 1000) // SAVE_COOLDOWN is in seconds
			timeout = setTimeout(() => {saved = saveData()}, 10); // save after a short delay (sometimes multiple things are changed at once)
		else
			timeout = setTimeout(() => {saved = saveData()}, (SAVE_COOLDOWN * 1000) - (new Date().getTime() - lastSave.getTime()));
	}
};
const cancelSave = () => {
	clearTimeout(timeout);
	updated = false;
};
// set up modify functions
userOnModifyFunctions.push(onModify);
voiceChatOnModifyFunctions.push(onModify);
filterOnModifyFunctions.push(onModify);

export type DataType = {
	voiceChats: WatcherMap<string, VoiceChat>;
	users: WatcherMap<string, DiscordUser>;
}
export const data: DataType = {
	voiceChats: VoiceChat.voiceChats,
	users: DiscordUser.users,
};
// read data.txt
if (fs.existsSync(dataPath)) { 
	const storedText = fs.readFileSync(dataPath).toString();
	if (storedText != "") {
		JSON.parse(storedText, reviver); // parse text with reviver
		// OnModify is called when each object is created, so we need to cancel the save
		cancelSave();

		console.log("data succesfully restored from data.txt");
	}
	else {
		saved = saveData();
		console.log("data.txt was empty, so data was reset to default");
	}
}
// if data.txt doesn't exist
else {
	// create file
	fs.mkdirSync(path.dirname(dataPath), { recursive: true });
	fs.writeFileSync(dataPath, "");
	console.log("data.txt was empty, so data will be reset to default");
	saveData();
}

// save data when exiting
[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `SIGTERM`].forEach((eventType) => {
	process.on(eventType, async (err) => {
		if (err)
			console.error(err);
 
		// wait for data to be saved
		await saved;

		// save immediately if data has been updated
		if (updated) {
			cancelSave();
			await saveData();
		}

		process.exit(0);
	});
});
