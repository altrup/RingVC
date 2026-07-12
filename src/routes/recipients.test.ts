import { Interaction } from "discord.js";
import { beforeEach, expect, test, vi } from "vitest";

import { setAutoRing, unsetAutoRing } from "@db/auto-ring";
import { recipientsHandlers } from "@routes/recipients";

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

type AutoRingPost = NonNullable<typeof recipientsHandlers.autoRing.post>;
const autoRingState = (scope: string, query: string) =>
	({
		params: { scope },
		path: `/recipients/${scope}/auto-ring`,
		queryParams: new URLSearchParams(query),
		timestamp: 0,
	}) as unknown as Parameters<AutoRingPost>[2];

beforeEach(() => {
	vi.clearAllMocks();
});

test("enabling auto-ring warns that joins ring default recipients even in stealth", async () => {
	vi.mocked(setAutoRing).mockResolvedValue(true);

	const result = await recipientsHandlers.autoRing.post!(
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

	const result = await recipientsHandlers.autoRing.post!(
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

	const result = await recipientsHandlers.autoRingUnset.post!(
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
