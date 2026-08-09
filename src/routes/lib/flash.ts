import { RouteRedirect } from "discord-embed-router";
import { Interaction } from "discord.js";

export type FlashLevel = "success" | "warn";

// the compact outcome view slash-command mutations land on (routes/notice)
export const NOTICE = "/notice";

// the redirect a mutation handler returns so its outcome shows as a notice.
// Component and modal interactions come from a panel, so the notice rides the
// target panel's in-flight query params only — the components the GET builds
// don't carry it, so it clears on the next interaction. Slash commands never
// showed a panel, so they land on the compact notice view instead, with the
// panel (and its extra params) folded into its `to` target
export const flashRedirect = (
	interaction: Interaction,
	redirect: string,
	flash: string,
	level: FlashLevel,
	extraParams: Record<string, string> = {},
): RouteRedirect => {
	if (interaction.isChatInputCommand()) {
		const query = new URLSearchParams(extraParams).toString();
		return {
			redirect: NOTICE,
			queryParams: {
				flash,
				level,
				to: query ? `${redirect}?${query}` : redirect,
			},
		};
	}
	return { redirect, queryParams: { flash, level, ...extraParams } };
};

// panels that render a blocked state in their own embed lead with this too,
// so the icon for a level is decided in one place
export const flashIcon = (level: FlashLevel): string =>
	level === "warn" ? "⚠️" : "✅";

// the flash as plain lines led by the level icon — what the notice view shows
// as its whole body
export const flashText = (queryParams: URLSearchParams): string | null => {
	const flash = queryParams.get("flash");
	if (!flash) return null;
	const level = queryParams.get("level") === "warn" ? "warn" : "success";
	return `${flashIcon(level)} ${flash}`;
};

// the notice a panel renders at the bottom of its embed, as a markdown
// blockquote so it separates from the body
export const flashLine = (queryParams: URLSearchParams): string | null => {
	const text = flashText(queryParams);
	if (text === null) return null;
	return text
		.split("\n")
		.map((line) => `> ${line}`)
		.join("\n");
};

// an embed description with the flash notice, when present, below the body,
// always with one blank line between the body and the blockquote
export const withFlash = (
	queryParams: URLSearchParams,
	body: string,
): string => {
	const line = flashLine(queryParams);
	return line ? `${body}\n\n${line}` : body;
};
