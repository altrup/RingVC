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

// bolds the flash's opening clause (through the first period, or the whole
// text when it has none) so the outcome reads at a glance
const boldLead = (text: string): string => {
	const periodIndex = text.indexOf(".");
	if (periodIndex === -1) return `**${text}**`;
	return `**${text.slice(0, periodIndex + 1)}**${text.slice(periodIndex + 1)}`;
};

// the flash as plain lines with the level icon and a bold lead — what the
// notice view shows as its whole body
export const flashText = (queryParams: URLSearchParams): string | null => {
	const flash = queryParams.get("flash");
	if (!flash) return null;
	const icon = queryParams.get("level") === "warn" ? "⚠️" : "✅";
	// bold only the first line's lead: Discord bold can't span newlines, so
	// the markers must open and close on one line
	const [first = "", ...rest] = flash.split("\n");
	return [`${icon} ${boldLead(first)}`, ...rest].join("\n");
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
