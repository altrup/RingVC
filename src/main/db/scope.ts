// builds a PostgREST filter for a channel scope (null = global)
export const scopeFilter = <
	T extends {
		eq: (column: string, value: string) => T;
		is: (column: string, value: null) => T;
	},
>(
	query: T,
	channelId: string | null,
): T => {
	return channelId === null
		? query.is("channel_id", null)
		: query.eq("channel_id", channelId);
};
