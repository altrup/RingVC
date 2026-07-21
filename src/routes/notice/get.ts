import { RouteButtonBuilder } from "discord-embed-router";
import { ButtonStyle, EmbedBuilder } from "discord.js";

import { row } from "@routes/lib/components";
import { flashText } from "@routes/lib/flash";
import { Handler } from "@routes/types";

// Discord's green/yellow, matching the flash line's ✅/⚠️ icon
const COLORS = { success: "#57f287", warn: "#fee75c" } as const;

// panels a slash-command mutation can land on, longest prefix first
const PANEL_NAMES: readonly (readonly [string, string])[] = [
	["/signups/roles", "Role signups"],
	["/signups", "Signups"],
	["/recipients", "Default ringees"],
	["/ring", "Quick ring"],
	["/mode", "Mode"],
];

const openLabel = (path: string): string => {
	const match = PANEL_NAMES.find(([prefix]) => path.startsWith(prefix));
	return match ? `Open ${match[1]} panel` : "Open panel";
};

export const noticeGet: Handler<"GET"> = (router, interaction, state) => {
	const to = state.queryParams.get("to") ?? "/";
	const [path = "/", query = ""] = to.split("?");
	const open = new RouteButtonBuilder(router)
		.setLabel(openLabel(path))
		.setStyle(ButtonStyle.Secondary)
		.setTo(path, { method: "GET", queryParams: query });
	return {
		embeds: [
			new EmbedBuilder()
				.setColor(
					COLORS[state.queryParams.get("level") === "warn" ? "warn" : "success"],
				)
				.setDescription(flashText(state.queryParams) ?? "Done"),
		],
		components: [row(open)],
	};
};
