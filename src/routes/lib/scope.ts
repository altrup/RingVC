// scoped panels (filter, recipients) address their scope in the path:
// "global", or a voice channel id

export const scopeOf = (
	params: Partial<Record<string, string | string[]>>,
): string => {
	const scope = params.scope;
	return typeof scope === "string" && scope.length > 0 ? scope : "global";
};

export const channelIdOf = (scope: string): string | null =>
	scope === "global" ? null : scope;

// "your global filter" / "your filter for <#id>"
export const scopeName = (
	scope: string,
	noun: string,
	{ capitalize = false }: { capitalize?: boolean } = {},
): string => {
	const your = capitalize ? "Your" : "your";
	return scope === "global"
		? `${your} global ${noun}`
		: `${your} ${noun} for <#${scope}>`;
};
