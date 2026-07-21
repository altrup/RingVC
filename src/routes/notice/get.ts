import { RouteButtonBuilder } from "discord-embed-router";
import { ButtonStyle, EmbedBuilder } from "discord.js";

import { row } from "@routes/lib/components";
import { flashText } from "@routes/lib/flash";
import { Handler } from "@routes/types";

// panels a slash-command mutation can land on, longest prefix first
const PANEL_NAMES = [
	["/filter/global", "Global filter"],
	["/signups/roles", "Role signups"],
	["/signups", "Signups"],
	["/recipients", "Default ringees"],
	["/ring", "Quick ring"],
	["/mode", "Mode"],
] as const;

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
				// Discord's yellow/green, matching the flash line's ⚠️/✅ icon
				.setColor(
					state.queryParams.get("level") === "warn" ? "#fee75c" : "#57f287",
				)
				.setDescription(flashText(state.queryParams) ?? "Done"),
		],
		components: [row(open)],
	};
};
