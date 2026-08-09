import { Interaction } from "discord.js";
import { beforeEach, expect, test, vi } from "vitest";

import { setAutoRing } from "@db/auto-ring";
import { resetDefaultRingees } from "@db/default-ringees";

import { ringeesAutoRingPost } from "./[scope]/auto-ring/post";
import { ringeesResetPost } from "./[scope]/reset/post";

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
		path: `/ringees/${scope}/auto-ring`,
		queryParams: new URLSearchParams(query),
		timestamp: 0,
	}) as unknown as Parameters<typeof ringeesAutoRingPost>[2];

const resetPost = (confirmation: string) =>
	ringeesResetPost(undefined as never, interaction, {
		params: { scope: "global" },
		path: "/ringees/global/reset",
		queryParams: new URLSearchParams(),
		timestamp: 0,
		fields: { getTextInputValue: () => confirmation },
	} as unknown as Parameters<typeof ringeesResetPost>[2]);

beforeEach(() => {
	vi.clearAllMocks();
});

test("a ringees reset with matching confirmation text clears the list", async () => {
	vi.mocked(resetDefaultRingees).mockResolvedValue(true);

	const result = await resetPost("RESET");

	expect(resetDefaultRingees).toHaveBeenCalledExactlyOnceWith("caller", null);
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("success");
});

test("a ringees reset without matching confirmation text mutates nothing", async () => {
	const result = await resetPost("nope");

	expect(resetDefaultRingees).not.toHaveBeenCalled();
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("warn");
	expect(flashParams.get("flash")).toContain("did not match");
});

test("enabling auto-ring warns that joins ring default ringees even in stealth", async () => {
	vi.mocked(setAutoRing).mockResolvedValue(true);

	const result = await ringeesAutoRingPost(
		undefined as never,
		interaction,
		autoRingState("123", "enable=1"),
	);

	expect(setAutoRing).toHaveBeenCalledExactlyOnceWith("caller", "123", true);
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	// the toggle succeeded, so the flash is a success carrying its caveat on a
	// second line marked as the warning
	expect(flashParams.get("level")).toBe("success");
	const [enabled = "", caveat = ""] = (flashParams.get("flash") ?? "").split(
		"\n",
	);
	expect(enabled).toContain("✅");
	expect(caveat).toContain("ℹ️");
	expect(caveat).toContain("stealth");
});

test("toggling auto-ring to its current value reports no change", async () => {
	vi.mocked(setAutoRing).mockResolvedValue(false);

	const result = await ringeesAutoRingPost(
		undefined as never,
		interaction,
		autoRingState("global", "enable=0"),
	);

	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("flash")).toContain("already");
});
