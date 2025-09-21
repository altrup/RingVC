import * as dotenv from "dotenv";

dotenv.config({ quiet: true });

if (process.env.DISCORD_TOKEN === undefined || process.env.DISCORD_CLIENT_ID === undefined || process.env.SAVE_COOLDOWN === undefined) {
	throw new Error("Missing environment variables");
}

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const SAVE_COOLDOWN = parseFloat(process.env.SAVE_COOLDOWN);

export {
	DISCORD_TOKEN,
	DISCORD_CLIENT_ID,
	SAVE_COOLDOWN,
};

