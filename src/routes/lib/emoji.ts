import { ComponentEmojiResolvable, Interaction } from "discord.js";

// branded custom emoji: identity mark and voice-channel action mark
export const RINGVC_EMOJI_ID = "1324809350899961877";
export const VC_EMOJI_ID = "1326000686575521883";

// the emoji image on the CDN, usable as an embed author or thumbnail icon.
// A plain image URL renders for anyone, so it needs no access check; an
// invalid id simply 404s and the icon is dropped
export const emojiIconURL = (id: string): string =>
	`https://cdn.discordapp.com/emojis/${id}.webp`;

// a custom emoji on a button only renders when the bot can use it: an
// application emoji it owns (fetched into client.application.emojis at
// startup) or an emoji from a guild it shares. Otherwise Discord shows a
// broken glyph, so callers fall back to no emoji
export const buttonEmoji = (
	interaction: Interaction,
	id: string,
): ComponentEmojiResolvable | undefined => {
	const client = interaction.client;
	return client.application?.emojis.cache.has(id) || client.emojis.cache.has(id)
		? { id }
		: undefined;
};
