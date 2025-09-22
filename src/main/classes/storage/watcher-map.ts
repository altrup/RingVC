// class for watching maps
class WatcherMap<K, V> extends Map<K, V> {
	private onModify: () => void;
	private onGet: () => void;

	// onset and onget are functions
	constructor(onModify: null | (() => void), onGet: null | (() => void), ...args: ConstructorParameters<typeof Map<K, V>>) {
		super(...args);

		this.onModify = (onModify === null || typeof onModify === "undefined")? () => {}: onModify;
		this.onGet = (onGet === null || typeof onGet === "undefined")? () => {}: onGet;
	}

	set(...args: Parameters<Map<K, V>["set"]>) {
		const returnVal = super.set(...args);
		this.onModify();
		return returnVal;
	}

	delete(...args: Parameters<Map<K, V>["delete"]>) {
		const returnVal = super.delete(...args);
		this.onModify();
		return returnVal;
	}

	clear(...args: Parameters<Map<K, V>["clear"]>) {
		const returnVal = super.clear(...args);
		this.onModify();
		return returnVal;
	}

	get(...args: Parameters<Map<K, V>["get"]>) {
		const returnVal = super.get(...args);
		this.onGet();
		return returnVal;
	}
}

export {
	WatcherMap
}