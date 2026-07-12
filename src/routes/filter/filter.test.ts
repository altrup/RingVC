import { Interaction } from "discord.js";
import { beforeEach, expect, test, vi } from "vitest";

import {
	addFilterEntry,
	getFilter,
	removeFilterEntry,
	resetFilter,
} from "@db/filters";

import { filterMembersPost } from "./[scope]/members/post";
import { filterResetPost } from "./[scope]/reset/post";

vi.mock("@db/filters", async (importOriginal) => ({
	...(await importOriginal<typeof import("@db/filters")>()),
	getFilter: vi.fn(),
	addFilterEntry: vi.fn(),
	removeFilterEntry: vi.fn(),
	setFilterType: vi.fn(),
	resetFilter: vi.fn(),
}));

const interaction = { user: { id: "caller" } } as unknown as Interaction;

const membersState = (query: string, values?: string[]) =>
	({
		params: { scope: "global" },
		path: "/filter/global/members",
		queryParams: new URLSearchParams(query),
		timestamp: 0,
		globals: { commandIds: new Map() },
		values,
	}) as unknown as Parameters<typeof filterMembersPost>[2];

const membersPost = (query: string, values?: string[]) =>
	filterMembersPost(
		undefined as never,
		interaction,
		membersState(query, values),
	);

const resetPost = (confirmation: string) =>
	filterResetPost(undefined as never, interaction, {
		params: { scope: "global" },
		path: "/filter/global/reset",
		queryParams: new URLSearchParams(),
		timestamp: 0,
		fields: { getTextInputValue: () => confirmation },
	} as unknown as Parameters<typeof filterResetPost>[2]);

beforeEach(() => {
	vi.clearAllMocks();
});

test("blocking while the global filter is a whitelist explains and mutates nothing", async () => {
	vi.mocked(getFilter).mockResolvedValue({
		isWhitelist: true,
		entries: new Set(),
	});

	const result = await membersPost("intent=block&add=42");

	expect(result.redirect).toBe("/filter/global");
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("warn");
	expect(flashParams.get("flash")).toContain("whitelist");
	expect(addFilterEntry).not.toHaveBeenCalled();
	expect(removeFilterEntry).not.toHaveBeenCalled();
});

test("a select submission applies adds and removes from the visible page together", async () => {
	vi.mocked(getFilter).mockResolvedValue({
		isWhitelist: false,
		entries: new Set(["1", "2"]),
	});

	const result = await membersPost("page=0", ["2", "9"]);

	expect(addFilterEntry).toHaveBeenCalledExactlyOnceWith("caller", null, "9");
	expect(removeFilterEntry).toHaveBeenCalledExactlyOnceWith(
		"caller",
		null,
		"1",
	);
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("success");
});

test("a filter reset with matching confirmation text resets the filter", async () => {
	vi.mocked(resetFilter).mockResolvedValue(true);

	const result = await resetPost("RESET");

	expect(resetFilter).toHaveBeenCalledExactlyOnceWith("caller", null);
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("success");
});

test("a filter reset without matching confirmation text mutates nothing", async () => {
	const result = await resetPost("nope");

	expect(resetFilter).not.toHaveBeenCalled();
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("warn");
	expect(flashParams.get("flash")).toContain("did not match");
});

test("blocking an already blocked user reports it without a duplicate write", async () => {
	vi.mocked(getFilter).mockResolvedValue({
		isWhitelist: false,
		entries: new Set(["42"]),
	});

	const result = await membersPost("intent=block&add=42");

	expect(addFilterEntry).not.toHaveBeenCalled();
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("flash")).toContain("already");
});
