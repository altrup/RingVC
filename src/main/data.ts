import * as fs from 'fs';
import * as path from 'path';

// get setting
import { SAVE_COOLDOWN } from '@src/config';

// get classes
import { WatcherMap } from '@main/classes/storage/watcher-map';
import { DiscordUser, userOnModifyFunctions } from '@main/classes/commands/discord-user';
import { VoiceChat, voiceChatOnModifyFunctions } from '@main/classes/commands/voice-chat';
import { Filter, filterOnModifyFunctions } from '@main/classes/commands/filter';

const tempDataPath = path.join(process.cwd(), "data", "data.tmp.txt");
const dataPath = path.join(process.cwd(), "data", "data.txt");

// stolen from https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
const replacer = (key: string, value: any) => {
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
				voiceChannels: value.getVoiceChannels(),
				globalFilter: value.getGlobalFilter(),
				mode: value.getMode()
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
const reviver = (key: string, value: any) => {
	if(typeof value === 'object' && value !== null) {
		if (value.dataType === 'Map')
			return value.value.reduce((map: WatcherMap<unknown, unknown>, object: [unknown, unknown]) => {
				map.set(object[0], object[1]);
				return map;
			}, new WatcherMap(onModify, null));
		else if (value.dataType === 'DiscordUser') {
			if (value.value.userId && value.value.voiceChannels && value.value.globalFilter && value.value.mode
					&& !DiscordUser.isDefault(value.value.voiceChannels, value.value.globalFilter, value.value.mode))
				return new DiscordUser(value.value.userId, value.value.voiceChannels.entries(), value.value.globalFilter, value.value.mode);
		}
		else if (value.dataType === 'VoiceChat') {
			if (!VoiceChat.isDefault(value.value.userIds.keys()))
				return new VoiceChat(value.value.channelId, value.value.userIds.keys(), true);
		}
		else if (value.dataType === 'VoiceChannelFilter')
			return new Filter(value.value.isWhitelist, value.value.list.keys());
	}
	return value;
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
