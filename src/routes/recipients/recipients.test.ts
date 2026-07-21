import { Interaction } from "discord.js";
import { beforeEach, expect, test, vi } from "vitest";

import { setAutoRing } from "@db/auto-ring";
import { resetDefaultRingees } from "@db/default-ringees";

import { recipientsAutoRingPost } from "./[scope]/auto-ring/post";
import { recipientsResetPost } from "./[scope]/reset/post";

vi.mock("@db/auto-ring", () => ({
	getAutoRingSetting: vi.fn(),
	setAutoRing: vi.fn(),
}));
vi.mock("@db/default-ringees", () => ({
	getDefaultRingees: vi.fn(),
	addDefaultRingee: vi.fn(),
	removeDefaultRingee: vi.fn(),
	resetDefaultRingees: vi.fn(),
}));

const interaction = {
	user: { id: "caller" },
	isChatInputCommand: () => false,
} as unknown as Interaction;

const autoRingState = (scope: string, query: string) =>
	({
		params: { scope },
		path: `/recipients/${scope}/auto-ring`,
		queryParams: new URLSearchParams(query),
		timestamp: 0,
	}) as unknown as Parameters<typeof recipientsAutoRingPost>[2];

const resetPost = (confirmation: string) =>
	recipientsResetPost(undefined as never, interaction, {
		params: { scope: "global" },
		path: "/recipients/global/reset",
		queryParams: new URLSearchParams(),
		timestamp: 0,
		fields: { getTextInputValue: () => confirmation },
	} as unknown as Parameters<typeof recipientsResetPost>[2]);

beforeEach(() => {
	vi.clearAllMocks();
});

test("a recipients reset with matching confirmation text clears the list", async () => {
	vi.mocked(resetDefaultRingees).mockResolvedValue(true);

	const result = await resetPost("RESET");

	expect(resetDefaultRingees).toHaveBeenCalledExactlyOnceWith("caller", null);
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("success");
});

test("a recipients reset without matching confirmation text mutates nothing", async () => {
	const result = await resetPost("nope");

	expect(resetDefaultRingees).not.toHaveBeenCalled();
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("warn");
	expect(flashParams.get("flash")).toContain("did not match");
});

test("enabling auto-ring warns that joins ring default recipients even in stealth", async () => {
	vi.mocked(setAutoRing).mockResolvedValue(true);

	const result = await recipientsAutoRingPost(
		undefined as never,
		interaction,
		autoRingState("123", "enable=1"),
	);

	expect(setAutoRing).toHaveBeenCalledExactlyOnceWith("caller", "123", true);
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("warn");
	expect(flashParams.get("flash")).toContain("stealth");
});

test("toggling auto-ring to its current value reports no change", async () => {
	vi.mocked(setAutoRing).mockResolvedValue(false);

	const result = await recipientsAutoRingPost(
		undefined as never,
		interaction,
		autoRingState("global", "enable=0"),
	);

	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("flash")).toContain("already");
});
