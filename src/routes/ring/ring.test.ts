import { Interaction } from "discord.js";
import { beforeEach, expect, test, vi } from "vitest";

import { ring, ringDefaultUsers } from "@main/ring";

import { ringDefaultPost } from "./default/post";
import { ringUsersPost } from "./users/post";

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
		inGuild: () => true,
	}) as unknown as Interaction;

const state = (query: string, values?: string[]) =>
	({
		params: {},
		path: "/ring/users",
		queryParams: new URLSearchParams(query),
		timestamp: 0,
		globals: { commandIds: new Map() },
		values,
	}) as unknown as Parameters<typeof ringUsersPost>[2];

const defaultState = () =>
	({
		params: {},
		path: "/ring/default",
		queryParams: new URLSearchParams(),
		timestamp: 0,
		globals: { commandIds: new Map() },
	}) as unknown as Parameters<typeof ringDefaultPost>[2];

beforeEach(() => {
	vi.clearAllMocks();
});

test("ringing defaults rings the saved list and returns to the Quick ring panel", async () => {
	vi.mocked(ringDefaultUsers).mockResolvedValue([
		{ userId: "9", status: "fulfilled" },
	]);

	const result = await ringDefaultPost(
		undefined as never,
		makeInteraction(true),
		defaultState(),
	);

	expect(ringDefaultUsers).toHaveBeenCalledExactlyOnceWith(
		voiceChannel,
		"caller",
		"wants you to join",
	);
	expect(result.redirect).toBe("/ring");
});

test("ringing defaults while not in a voice channel warns without ringing", async () => {
	const result = await ringDefaultPost(
		undefined as never,
		makeInteraction(false),
		defaultState(),
	);

	expect(ringDefaultUsers).not.toHaveBeenCalled();
	expect(result.redirect).toBe("/ring");
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("warn");
});

test("ringing while not in a voice channel flashes the join hint and rings nobody", async () => {
	const result = await ringUsersPost(
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

test("ringing from a DM flashes the server-only hint and rings nobody", async () => {
	const dmInteraction = {
		user: { id: "caller" },
		member: null,
		inGuild: () => false,
	} as unknown as Interaction;
	const result = await ringUsersPost(
		undefined as never,
		dmInteraction,
		state("", ["9"]),
	);

	expect(ring).not.toHaveBeenCalled();
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("warn");
	expect(flashParams.get("flash")).toContain("Discord server");
});

test("a selection rings the submitted users and reports per-user outcomes", async () => {
	vi.mocked(ring).mockResolvedValue([
		{ userId: "9", status: "fulfilled" },
		{ userId: "8", status: "rejected", error: new Error("you blocked <@8>") },
	]);

	const result = await ringUsersPost(
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
