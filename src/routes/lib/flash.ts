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

// bolds the flash's opening clause (through the first period, or the whole
// text when it has none) so the outcome reads at a glance
const boldLead = (text: string): string => {
	const periodIndex = text.indexOf(".");
	if (periodIndex === -1) return `**${text}**`;
	return `**${text.slice(0, periodIndex + 1)}**${text.slice(periodIndex + 1)}`;
};

// the notice a panel renders at the top of its embed, as a markdown
// blockquote (Discord draws a grey left bar) so it separates from the body;
// the level picks the icon and the opening clause is bolded
export const flashLine = (queryParams: URLSearchParams): string | null => {
	const flash = queryParams.get("flash");
	if (!flash) return null;
	const icon = queryParams.get("level") === "warn" ? "⚠️" : "✅";
	return `${icon} ${boldLead(flash)}`
		.split("\n")
		.map((line) => `> ${line}`)
		.join("\n");
};

// an embed description with the flash notice, when present, above the body,
// always with one blank line between the blockquote and the body
export const withFlash = (
	queryParams: URLSearchParams,
	body: string,
): string => {
	const line = flashLine(queryParams);
	return line ? `${line}\n\n${body}` : body;
};
