import { RouteButtonBuilder } from "discord-embed-router";
import { ButtonStyle, EmbedBuilder } from "discord.js";

import { DiscordUserMode, getUserMode, setUserMode } from "@db/users";
import { homeButton, row } from "@routes/lib/components";
import { flashRedirect, withFlash } from "@routes/lib/flash";
import { Handler, Handlers } from "@routes/types";

const COLOR = "#F5853F";
const PATH = "/mode";

const MODES: { mode: DiscordUserMode; label: string; effect: string }[] = [
	{
		mode: "normal",
		label: "Normal",
		effect: "Joining a voice channel rings all applicable users",
	},
	{
		mode: "stealth",
		label: "Stealth",
		effect: "Joining a voice channel rings nobody",
	},
	{
		mode: "auto",
		label: "Auto",
		effect: "Stealth while you are invisible on Discord, normal otherwise",
	},
];

const isMode = (value: string | null): value is DiscordUserMode =>
	MODES.some(({ mode }) => mode === value);

const panelGet: Handler<"GET"> = async (router, interaction, state) => {
	const current = await getUserMode(interaction.user.id);

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("Your mode")
				.setDescription(
					withFlash(
						state.queryParams,
						`Modes decide what happens when you join a voice channel. Your current mode is **${current}**.`,
					),
				)
				.addFields(
					MODES.map(({ label, effect }) => ({ name: label, value: effect })),
				),
		],
		components: [
			row(
				...MODES.map(({ mode, label }) =>
					new RouteButtonBuilder(router)
						.setLabel(label)
						.setStyle(
							mode === current ? ButtonStyle.Primary : ButtonStyle.Secondary,
						)
						.setDisabled(mode === current)
						.setTo(PATH, { method: "POST", queryParams: { set: mode } }),
				),
				homeButton(router),
			),
		],
	};
};

const panelPost: Handler<"POST"> = async (router, interaction, state) => {
	const target = state.queryParams.get("set");
	if (!isMode(target))
		return flashRedirect(PATH, "Unknown mode, nothing changed", "warn");

	const current = await getUserMode(interaction.user.id);
	if (current === target)
		return flashRedirect(PATH, `Your mode is already ${target}`, "warn");

	await setUserMode(interaction.user.id, target);
	const effect = MODES.find(({ mode }) => mode === target)?.effect ?? "";
	return flashRedirect(PATH, `Mode set to ${target}. ${effect}`, "success");
};

export const modeHandlers = {
	panel: { get: panelGet, post: panelPost } satisfies Handlers,
};
