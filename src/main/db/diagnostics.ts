import { db } from "./client";

// diagnostics must never break or slow the bot: both writes are
// fire-and-forget and swallow their own failures

export const recordUsage = (interaction: string): void => {
	db.rpc("record_usage", { p_interaction: interaction }).then(({ error }) => {
		if (error) console.error("recordUsage failed:", error.message);
	}, console.error);
};

// keeps only what can't contain user data — the error's name, its code, and
// its stack frames (code locations). The free-text message is deliberately
// dropped: it can embed IDs, server names, and channel names, and the privacy
// policy forbids storing those
const describeError = (error: unknown): string => {
	if (!(error instanceof Error)) return typeof error;
	const code = (error as { code?: unknown }).code;
	const label =
		typeof code === "number" || typeof code === "string"
			? `${error.name} (${code})`
			: error.name;
	const frames = (error.stack ?? "")
		.split("\n")
		.filter((line) => line.trimStart().startsWith("at "))
		.join("\n");
	return frames ? `${label}\n${frames}` : label;
};

export const recordError = (interaction: string, error: unknown): void => {
	db.from("error_reports")
		.insert({ interaction, error: describeError(error) })
		.then(({ error: dbError }) => {
			if (dbError) console.error("recordError failed:", dbError.message);
		}, console.error);
};
