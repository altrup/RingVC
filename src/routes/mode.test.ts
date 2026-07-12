import { modeHandlers } from "@routes/mode";
import { Interaction } from "discord.js";
import { beforeEach, expect, test, vi } from "vitest";

import { getUserMode, setUserMode } from "@db/users";

vi.mock("@db/users", () => ({
	getUserMode: vi.fn(),
	setUserMode: vi.fn(),
}));

const interaction = { user: { id: "caller" } } as unknown as Interaction;

type ModePost = NonNullable<typeof modeHandlers.panel.post>;
const state = (query: string) =>
	({
		params: {},
		path: "/mode",
		queryParams: new URLSearchParams(query),
		timestamp: 0,
	}) as unknown as Parameters<ModePost>[2];

beforeEach(() => {
	vi.clearAllMocks();
});

test("setting a mode persists it and confirms what it does", async () => {
	vi.mocked(getUserMode).mockResolvedValue("normal");

	const result = await modeHandlers.panel.post!(
		undefined as never,
		interaction,
		state("set=stealth"),
	);

	expect(setUserMode).toHaveBeenCalledExactlyOnceWith("caller", "stealth");
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("success");
});

test("an unknown mode value writes nothing", async () => {
	vi.mocked(getUserMode).mockResolvedValue("normal");

	const result = await modeHandlers.panel.post!(
		undefined as never,
		interaction,
		state("set=loud"),
	);

	expect(setUserMode).not.toHaveBeenCalled();
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("warn");
});
