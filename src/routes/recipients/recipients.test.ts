import { Interaction } from "discord.js";
import { beforeEach, expect, test, vi } from "vitest";

import { setAutoRing, unsetAutoRing } from "@db/auto-ring";
import { clearDefaultRingees } from "@db/default-ringees";

import { recipientsAutoRingPost } from "./[scope]/auto-ring/post";
import { recipientsAutoRingUnsetPost } from "./[scope]/auto-ring/unset/post";
import { recipientsClearPost } from "./[scope]/clear/post";

vi.mock("@db/auto-ring", () => ({
	getAutoRingSetting: vi.fn(),
	setAutoRing: vi.fn(),
	unsetAutoRing: vi.fn(),
}));
vi.mock("@db/default-ringees", () => ({
	getDefaultRingees: vi.fn(),
	addDefaultRingee: vi.fn(),
	removeDefaultRingee: vi.fn(),
	clearDefaultRingees: vi.fn(),
}));

const interaction = { user: { id: "caller" } } as unknown as Interaction;

const autoRingState = (scope: string, query: string) =>
	({
		params: { scope },
		path: `/recipients/${scope}/auto-ring`,
		queryParams: new URLSearchParams(query),
		timestamp: 0,
	}) as unknown as Parameters<typeof recipientsAutoRingPost>[2];

const clearPost = (confirmation: string) =>
	recipientsClearPost(undefined as never, interaction, {
		params: { scope: "global" },
		path: "/recipients/global/clear",
		queryParams: new URLSearchParams(),
		timestamp: 0,
		fields: { getTextInputValue: () => confirmation },
	} as unknown as Parameters<typeof recipientsClearPost>[2]);

beforeEach(() => {
	vi.clearAllMocks();
});

test("a recipients reset with matching confirmation text clears the list", async () => {
	vi.mocked(clearDefaultRingees).mockResolvedValue(true);

	const result = await clearPost("RESET");

	expect(clearDefaultRingees).toHaveBeenCalledExactlyOnceWith("caller", null);
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("success");
});

test("a recipients reset without matching confirmation text mutates nothing", async () => {
	const result = await clearPost("nope");

	expect(clearDefaultRingees).not.toHaveBeenCalled();
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

test("removing a missing auto-ring override reports there was none", async () => {
	vi.mocked(unsetAutoRing).mockResolvedValue(false);

	const result = await recipientsAutoRingUnsetPost(
		undefined as never,
		interaction,
		autoRingState("123", ""),
	);

	expect(unsetAutoRing).toHaveBeenCalledExactlyOnceWith("caller", "123");
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("warn");
});
