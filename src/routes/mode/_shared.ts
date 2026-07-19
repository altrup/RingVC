import { DiscordUserMode } from "@db/users";

export const PATH = "/mode";

export const MODES: {
	mode: DiscordUserMode;
	label: string;
	effect: string;
}[] = [
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

export const isMode = (value: string | null): value is DiscordUserMode =>
	MODES.some(({ mode }) => mode === value);
