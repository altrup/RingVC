import { ComponentEmojiResolvable, Interaction } from "discord.js";

// branded custom emoji: identity mark and voice-channel action mark
export const RINGVC_EMOJI_ID = "1324809350899961877";
export const VC_EMOJI_ID = "1326000686575521883";

// custom emoji only render where the bot can resolve them; a client that
// doesn't share a guild carrying the emoji would show a broken glyph, so
// callers gate on availability and fall back to no emoji
const hasEmoji = (interaction: Interaction, id: string): boolean =>
	interaction.client.emojis.cache.has(id);

export const buttonEmoji = (
	interaction: Interaction,
	id: string,
): ComponentEmojiResolvable | undefined =>
	hasEmoji(interaction, id) ? { id } : undefined;

// the animated/static emoji image, usable as an embed author or thumbnail icon
export const emojiIconURL = (
	interaction: Interaction,
	id: string,
): string | undefined =>
	hasEmoji(interaction, id)
		? `https://cdn.discordapp.com/emojis/${id}.webp`
		: undefined;
