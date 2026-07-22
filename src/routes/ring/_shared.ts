import { Interaction, VoiceBasedChannel } from "discord.js";

import {
	getErrorMessage,
	joinWithAnd,
	mentionUser,
	ring,
	UserRingResult,
} from "@main/ring";
import { flashRedirect } from "@routes/lib/flash";
import { commandMention } from "@routes/lib/mentions";
import { Globals } from "@routes/types";

export const PANEL = "/ring";

// panels outlive the voice state that was true at render time, so every
// mutation re-checks it at click time
export const voiceChannelOf = (
	interaction: Interaction,
): VoiceBasedChannel | null =>
	interaction.member && "voice" in interaction.member
		? interaction.member.voice.channel
		: null;

// why there is no channel to ring in: server-only outside a guild, otherwise
// a prompt to join a voice channel
export const noVoiceChannelFlash = (
	interaction: Interaction,
	globals: Globals | undefined,
): string => {
	const ringMention = commandMention(globals, "ring");
	return interaction.inGuild()
		? `RingVC needs to know which voice channel to ring people in. Join one, then run ${ringMention} again.`
		: `RingVC can only ring people from within a Discord server. Run ${ringMention} in a server instead.`;
};

export const ringResultsFlash = (results: UserRingResult[]) => {
	const ringed = results
		.filter((result) => result.status === "fulfilled")
		.map((result) => mentionUser(result.userId));
	const lines = [
		...(ringed.length > 0 ? [`Ringed ${joinWithAnd(ringed)}`] : []),
		...results
			.filter((result) => result.status === "rejected")
			.map(
				(result) =>
					`Can't ring ${mentionUser(result.userId)} because ${result.error.message}`,
			),
	];
	return {
		flash: lines.join("\n"),
		level: ringed.length > 0 ? ("success" as const) : ("warn" as const),
	};
};

export const ringUserIds = async (
	interaction: Interaction,
	globals: Globals | undefined,
	userIds: string[],
) => {
	const channel = voiceChannelOf(interaction);
	if (!channel)
		return flashRedirect(
			interaction,
			PANEL,
			noVoiceChannelFlash(interaction, globals),
			"warn",
		);
	if (userIds.length === 0)
		return flashRedirect(
			interaction,
			PANEL,
			"Nobody was selected to ring",
			"warn",
		);

	try {
		const results = await ring(
			channel,
			interaction.user.id,
			"wants you to join",
			userIds,
		);
		const { flash, level } = ringResultsFlash(results);
		return flashRedirect(interaction, PANEL, flash, level);
	} catch (err) {
		return flashRedirect(
			interaction,
			PANEL,
			`Can't ring because ${getErrorMessage(err)}`,
			"warn",
		);
	}
};
