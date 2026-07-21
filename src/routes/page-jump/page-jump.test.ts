import { Interaction } from "discord.js";
import { expect, test } from "vitest";

import { pageJumpPost } from "./post";

const interaction = {
	user: { id: "caller" },
	isChatInputCommand: () => false,
} as unknown as Interaction;

const jump = async (query: string, input: string) =>
	pageJumpPost(undefined as never, interaction, {
		params: {},
		path: "/page-jump",
		queryParams: new URLSearchParams(query),
		timestamp: 0,
		fields: { getTextInputValue: () => input },
	} as unknown as Parameters<typeof pageJumpPost>[2]);

const flashParams = (result: Awaited<ReturnType<typeof jump>>) =>
	new URLSearchParams(result.queryParams as Record<string, string>);

test("a page number in range redirects to that page zero-indexed", async () => {
	const result = await jump("to=/signups&page=0&pageCount=3", "2");

	expect(result.redirect).toBe("/signups");
	expect(result.queryParams).toEqual({ page: "1" });
});

test("both range bounds are accepted", async () => {
	expect(
		(await jump("to=/signups&page=1&pageCount=3", "1")).queryParams,
	).toEqual({ page: "0" });
	expect(
		(await jump("to=/signups&page=1&pageCount=3", "3")).queryParams,
	).toEqual({ page: "2" });
});

test("a page number past the last page is rejected, staying on the origin page", async () => {
	const result = await jump("to=/signups&page=1&pageCount=3", "4");

	expect(result.redirect).toBe("/signups");
	const params = flashParams(result);
	expect(params.get("level")).toBe("warn");
	expect(params.get("flash")).toContain('"4" is not a valid page number');
	expect(params.get("page")).toBe("1");
});

test("zero is rejected (pages are one-based)", async () => {
	const params = flashParams(await jump("to=/signups&page=0&pageCount=3", "0"));

	expect(params.get("level")).toBe("warn");
	expect(params.get("flash")).toContain('"0" is not a valid page number');
});

test("non-numeric input is rejected", async () => {
	const params = flashParams(
		await jump("to=/signups&page=0&pageCount=3", "abc"),
	);

	expect(params.get("level")).toBe("warn");
	expect(params.get("flash")).toContain('"abc" is not a valid page number');
});

test("a missing pageCount param only accepts page 1", async () => {
	expect((await jump("to=/signups&page=0", "1")).queryParams).toEqual({
		page: "0",
	});
	expect(flashParams(await jump("to=/signups&page=0", "2")).get("level")).toBe(
		"warn",
	);
});
