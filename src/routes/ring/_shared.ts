import { Interaction, VoiceBasedChannel } from "discord.js";

import {
	getErrorMessage,
	joinWithAnd,
	mentionUser,
	ring,
	UserRingResult,
} from "@main/ring";
import { flashRedirect } from "@routes/lib/flash";

export const PANEL = "/ring";
export const NOT_IN_VC =
	"RingVC needs to know which voice channel to ring people in. Join one, then run /ring again.";
export const SERVER_ONLY =
	"RingVC can only ring people from within a Discord server. Run /ring in a server instead.";

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
export const noVoiceChannelFlash = (interaction: Interaction): string =>
	interaction.inGuild() ? NOT_IN_VC : SERVER_ONLY;

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
	userIds: string[],
) => {
	const channel = voiceChannelOf(interaction);
	if (!channel)
		return flashRedirect(
			interaction,
			PANEL,
			noVoiceChannelFlash(interaction),
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
