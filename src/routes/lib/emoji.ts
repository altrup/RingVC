// branded custom emoji used as the panel author icon
export const RINGVC_EMOJI_ID = "1324809350899961877";

// the emoji image on the CDN, usable as an embed author or thumbnail icon.
// A plain image URL renders for anyone, so it needs no access check; an
// invalid id simply 404s and the icon is dropped
export const emojiIconURL = (id: string): string =>
	`https://cdn.discordapp.com/emojis/${id}.webp`;
