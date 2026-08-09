import { Interaction } from "discord.js";
import { beforeEach, expect, test, vi } from "vitest";

import { submitFeedback } from "@db/feedback";

import { aboutFeedbackPost } from "./feedback/post";

vi.mock("@db/feedback", () => ({
	submitFeedback: vi.fn(),
}));

const interaction = {
	user: { id: "caller" },
	isCommand: () => false,
	isChatInputCommand: () => false,
} as unknown as Interaction;

const state = (content: string) =>
	({
		params: {},
		path: "/about/feedback",
		queryParams: new URLSearchParams(),
		timestamp: 0,
		fields: { getTextInputValue: () => content },
	}) as unknown as Parameters<typeof aboutFeedbackPost>[2];

beforeEach(() => {
	vi.clearAllMocks();
});

test("submitting feedback stores the trimmed text", async () => {
	const result = await aboutFeedbackPost(
		undefined as never,
		interaction,
		state("  great bot!  "),
	);

	expect(submitFeedback).toHaveBeenCalledExactlyOnceWith("great bot!");
	expect(result.redirect).toBe("/about");
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("success");
});

test("whitespace-only feedback stores nothing", async () => {
	const result = await aboutFeedbackPost(
		undefined as never,
		interaction,
		state("   "),
	);

	expect(submitFeedback).not.toHaveBeenCalled();
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("warn");
});
