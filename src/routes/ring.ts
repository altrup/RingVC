import { homeButton, row } from "@routes/lib/components";
import { flashRedirect, withFlash } from "@routes/lib/flash";
import { commandMention } from "@routes/lib/mentions";
import { PAGE_SIZE } from "@routes/lib/paging";
import { Handler, Handlers } from "@routes/types";
import {
	RouteButtonBuilder,
	RouteUserSelectMenuBuilder,
} from "discord-embed-router";
import {
	ActionRowBuilder,
	ButtonStyle,
	EmbedBuilder,
	Interaction,
	VoiceBasedChannel,
} from "discord.js";

import { getAllDefaultRingees } from "@db/default-ringees";
import {
	getErrorMessage,
	joinWithAnd,
	mentionUser,
	ring,
	ringDefaultUsers,
	UserRingResult,
} from "@main/ring";

const COLOR = "#c58a74";
const PANEL = "/ring";
const NOT_IN_VC =
	"RingVC needs to know which voice channel to ring people into. Join one, then run /ring again.";

// panels outlive the voice state that was true at render time, so every
// mutation re-checks it at click time
const voiceChannelOf = (interaction: Interaction): VoiceBasedChannel | null =>
	interaction.member && "voice" in interaction.member
		? interaction.member.voice.channel
		: null;

const panelGet: Handler<"GET"> = async (router, interaction, state) => {
	const channel = voiceChannelOf(interaction);
	if (!channel)
		return {
			embeds: [
				new EmbedBuilder()
					.setColor(COLOR)
					.setTitle("Ring")
					.setDescription(`⚠️ ${NOT_IN_VC}`),
			],
			components: [row(homeButton(router))],
		};

	const defaults = await getAllDefaultRingees(interaction.user.id, channel.id);
	const description = withFlash(
		state.queryParams,
		`Ringing people into <#${channel.id}>.\n\n` +
			(defaults.length > 0
				? `Your default recipients here: ${joinWithAnd(defaults.map(mentionUser))}`
				: "You have no default recipients here."),
	);

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(COLOR)
				.setTitle("Ring")
				.setDescription(description),
		],
		components: [
			new ActionRowBuilder<RouteUserSelectMenuBuilder>()
				.addComponents(
					new RouteUserSelectMenuBuilder(router)
						.setMinValues(1)
						.setMaxValues(PAGE_SIZE)
						.setPlaceholder("Select up to 25 people to ring")
						.setPattern(`${PANEL}/users`, { method: "POST" }),
				)
				.toJSON(),
			row(
				new RouteButtonBuilder(router)
					.setLabel("Ring defaults")
					.setStyle(ButtonStyle.Success)
					.setTo(`${PANEL}/default`, { method: "POST" }),
				homeButton(router),
			),
		],
	};
};

const ringResultsFlash = (results: UserRingResult[]) => {
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

const ringUserIds = async (interaction: Interaction, userIds: string[]) => {
	const channel = voiceChannelOf(interaction);
	if (!channel) return flashRedirect(PANEL, NOT_IN_VC, "warn");
	if (userIds.length === 0)
		return flashRedirect(PANEL, "Nobody was selected to ring", "warn");

	try {
		const results = await ring(
			channel,
			interaction.user.id,
			"wants you to join",
			userIds,
		);
		const { flash, level } = ringResultsFlash(results);
		return flashRedirect(PANEL, flash, level);
	} catch (err) {
		return flashRedirect(
			PANEL,
			`Can't ring because ${getErrorMessage(err)}`,
			"warn",
		);
	}
};

const usersPost: Handler<"POST"> = async (router, interaction, state) =>
	ringUserIds(interaction, state.values ?? []);

// the /ring user:@x quick path
const userPost: Handler<"POST"> = async (router, interaction, state) => {
	const userId = state.queryParams.get("id");
	return ringUserIds(interaction, userId ? [userId] : []);
};

const defaultPost: Handler<"POST"> = async (router, interaction, state) => {
	const channel = voiceChannelOf(interaction);
	if (!channel) return flashRedirect(PANEL, NOT_IN_VC, "warn");

	try {
		const results = await ringDefaultUsers(
			channel,
			interaction.user.id,
			"wants you to join",
		);
		const { flash, level } = ringResultsFlash(results);
		return flashRedirect(PANEL, flash, level);
	} catch (err) {
		const message = getErrorMessage(err);
		return message === "no default users to ring"
			? flashRedirect(
					PANEL,
					`You have no default ring recipients. Use the Ring recipients panel on the home page or ${commandMention(state.globals, "default_ring_recipients")} to add some`,
					"warn",
				)
			: flashRedirect(
					PANEL,
					`Can't ring your default recipients because ${message}`,
					"warn",
				);
	}
};

export const ringHandlers = {
	panel: { get: panelGet } satisfies Handlers,
	users: { post: usersPost } satisfies Handlers,
	user: { post: userPost } satisfies Handlers,
	default: { post: defaultPost } satisfies Handlers,
};
