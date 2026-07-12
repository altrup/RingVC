import * as dotenv from "dotenv";

dotenv.config({ quiet: true });

if (
	process.env.DISCORD_TOKEN === undefined ||
	process.env.DISCORD_CLIENT_ID === undefined ||
	process.env.SUPABASE_URL === undefined ||
	process.env.SUPABASE_SERVICE_ROLE_KEY === undefined
) {
	throw new Error("Missing environment variables");
}

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export {
	DISCORD_TOKEN,
	DISCORD_CLIENT_ID,
	SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY,
};
