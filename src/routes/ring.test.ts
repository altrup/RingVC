import { ringHandlers } from "@routes/ring";
import { Interaction } from "discord.js";
import { beforeEach, expect, test, vi } from "vitest";

import { ring } from "@main/ring";

vi.mock("@main/ring", async (importOriginal) => ({
	...(await importOriginal<typeof import("@main/ring")>()),
	ring: vi.fn(),
	ringDefaultUsers: vi.fn(),
}));
vi.mock("@db/default-ringees", () => ({
	getAllDefaultRingees: vi.fn(),
}));

const voiceChannel = { id: "vc1" };
const makeInteraction = (inVoice: boolean) =>
	({
		user: { id: "caller" },
		member: { voice: { channel: inVoice ? voiceChannel : null } },
	}) as unknown as Interaction;

type UsersPost = NonNullable<typeof ringHandlers.users.post>;
const state = (query: string, values?: string[]) =>
	({
		params: {},
		path: "/ring/users",
		queryParams: new URLSearchParams(query),
		timestamp: 0,
		globals: { commandIds: new Map() },
		values,
	}) as unknown as Parameters<UsersPost>[2];

beforeEach(() => {
	vi.clearAllMocks();
});

test("ringing while not in a voice channel flashes the join hint and rings nobody", async () => {
	const result = await ringHandlers.users.post!(
		undefined as never,
		makeInteraction(false),
		state("", ["9"]),
	);

	expect(ring).not.toHaveBeenCalled();
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("warn");
	expect(flashParams.get("flash")).toContain("voice channel");
});

test("a selection rings the submitted users and reports per-user outcomes", async () => {
	vi.mocked(ring).mockResolvedValue([
		{ userId: "9", status: "fulfilled" },
		{ userId: "8", status: "rejected", error: new Error("you blocked <@8>") },
	]);

	const result = await ringHandlers.users.post!(
		undefined as never,
		makeInteraction(true),
		state("", ["9", "8"]),
	);

	expect(ring).toHaveBeenCalledExactlyOnceWith(
		voiceChannel,
		"caller",
		"wants you to join",
		["9", "8"],
	);
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("flash")).toContain("Ringed <@9>");
	expect(flashParams.get("flash")).toContain("you blocked <@8>");
});
