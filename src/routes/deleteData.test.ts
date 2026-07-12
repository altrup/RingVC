import { Interaction } from "discord.js";
import { beforeEach, expect, test, vi } from "vitest";

import { deleteAllUserData } from "@db/users";
import { deleteDataHandlers } from "@routes/deleteData";

vi.mock("@db/users", () => ({
	deleteAllUserData: vi.fn(),
}));

const interaction = { user: { id: "caller" } } as unknown as Interaction;

type DeletePost = NonNullable<typeof deleteDataHandlers.panel.post>;
const state = (confirmation: string) =>
	({
		params: {},
		path: "/delete-data",
		queryParams: new URLSearchParams(),
		timestamp: 0,
		fields: { getTextInputValue: () => confirmation },
	}) as unknown as Parameters<DeletePost>[2];

beforeEach(() => {
	vi.clearAllMocks();
});

test("typing DELETE exactly deletes all user data", async () => {
	vi.mocked(deleteAllUserData).mockResolvedValue(true);

	const result = await deleteDataHandlers.panel.post!(
		undefined as never,
		interaction,
		state("DELETE"),
	);

	expect(deleteAllUserData).toHaveBeenCalledExactlyOnceWith("caller");
	expect(result.redirect).toBe("/delete-data");
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("success");
	expect(flashParams.get("done")).toBe("1");
});

test("a mismatched confirmation deletes nothing", async () => {
	const result = await deleteDataHandlers.panel.post!(
		undefined as never,
		interaction,
		state("delete"),
	);

	expect(deleteAllUserData).not.toHaveBeenCalled();
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("warn");
	expect(flashParams.get("flash")).toContain("did not match");
});
