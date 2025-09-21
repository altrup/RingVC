// both used to notify data.js
import { WatcherMap } from "@main/classes/storage/watcher-map";

export const filterOnModifyFunctions: (() => void)[] = [];
const onModify = () => {
	for (let i = 0; i < filterOnModifyFunctions.length; i ++)
		filterOnModifyFunctions[i]?.();
};

export type FilterType = "whitelist" | "blacklist";

// class for whitelist or blacklist
export class Filter {
	private isWhitelist: boolean;
	private list: WatcherMap<string, null>; // value doesn't matter, just using map for easy lookup

	public getIsWhitelist() { return this.isWhitelist; }
	public getList() { return this.list; }

	/* 
		isWhitelist is a boolean
		list is the whitelist or blacklist
		list is an array of userIds
	*/
	constructor(isWhitelist: boolean, list?: string[]) {
		this.isWhitelist = isWhitelist;

		this.list = new WatcherMap(onModify, null);
		if (list) {
			let listArray = Array.from(list);
			for (const userId of listArray)
				this.list.set(userId, null); // value doesn't matter
		}
	}

	// whether or not a user passes the filter
	filter(userId: string) {
		let listContainsUser = this.list.has(userId);

		return this.isWhitelist === listContainsUser;
	}
	

	// return whitelist or blacklist
	getType(): FilterType {
		return this.isWhitelist? "whitelist": "blacklist";
	}

	// sets the mode for a filter
	// string "whitelist" or "blacklist", defaults to blacklist
	// also clears filter
	setType(type: string) {
		if (type !== "whitelist" && type !== "blacklist") return;
		
		this.isWhitelist = (type === "whitelist")? true: false;

		this.clearFilter();

		// call on modify
		onModify();
	}

	// clears the filter
	clearFilter() {
		this.list = new WatcherMap(onModify, null);

		// call onmodify
		onModify();
	}

	// adds a user to the filter
	addUser(userId: string) {
		this.list.set(userId, null);
	}

	hasUser(userId: string) {
		return this.list.has(userId);
	}

	// removes a user from the filter
	removeUser(userId: string) {
		this.list.delete(userId);
	}
}
