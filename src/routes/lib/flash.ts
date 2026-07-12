import { RouteRedirect } from "discord-embed-router";

export type FlashLevel = "success" | "warn";

// the redirect a mutation handler returns so its outcome shows as a notice
// on the target panel. The flash lives only in the in-flight dispatch: the
// target GET receives it through state.queryParams and the components it
// builds don't carry it, so the notice clears on the next interaction
export const flashRedirect = (
	redirect: string,
	flash: string,
	level: FlashLevel,
	extraParams: Record<string, string> = {},
): RouteRedirect => ({
	redirect,
	queryParams: { flash, level, ...extraParams },
});

// the notice line a panel renders at the top of its embed; the flash text is
// shown verbatim, only the level picks the icon
export const flashLine = (queryParams: URLSearchParams): string | null => {
	const flash = queryParams.get("flash");
	if (!flash) return null;
	return `${queryParams.get("level") === "warn" ? "⚠️" : "✅"} ${flash}`;
};

// an embed description with the flash notice, when present, above the body
export const withFlash = (
	queryParams: URLSearchParams,
	body: string,
): string => {
	const line = flashLine(queryParams);
	return line ? `${line}\n\n${body}` : body;
};
