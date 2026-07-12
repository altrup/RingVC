import { User, VoiceBasedChannel } from "discord.js";
import { beforeEach, expect, test, vi } from "vitest";

import { isAutoRingEnabled } from "@db/auto-ring";
import { getAllDefaultRingees } from "@db/default-ringees";
import { getFiltersForUsers, UserFilters } from "@db/filters";
import { DiscordUserMode, getUserModes } from "@db/users";
import { getVoiceChatSignups } from "@db/voice-chats";
import { onVoiceChannelJoin, ring, validateRing } from "@main/ring";

vi.mock("@db/filters", async (importOriginal) => ({
	...(await importOriginal<typeof import("@db/filters")>()),
	getFiltersForUsers: vi.fn(),
}));
vi.mock("@db/users", () => ({
	getUserModes: vi.fn(),
}));
vi.mock("@db/voice-chats", () => ({
	getVoiceChatSignups: vi.fn(),
}));
vi.mock("@db/auto-ring", () => ({
	isAutoRingEnabled: vi.fn(),
}));
vi.mock("@db/default-ringees", () => ({
	getAllDefaultRingees: vi.fn(),
}));

type MemberOverrides = {
	presenceStatus?: string;
	roleIds?: string[];
};

const makeMember = (id: string, overrides: MemberOverrides = {}) => ({
	id,
	displayName: `name-${id}`,
	presence: { status: overrides.presenceStatus ?? "online" },
	roles: {
		cache: {
			has: (roleId: string) => overrides.roleIds?.includes(roleId) ?? false,
		},
	},
});

// a stub voice channel whose guild resolves any member id; ids listed in
// cannotConnect fail the Connect permission check
const makeChannel = ({
	memberIds = [] as string[],
	cannotConnect = [] as string[],
	memberOverrides = {} as Record<string, MemberOverrides>,
	roleIds = [] as string[],
} = {}) => {
	const memberOf = (id: string) => makeMember(id, memberOverrides[id] ?? {});
	const channel = {
		id: "vc1",
		name: "General",
		members: new Map(memberIds.map((id) => [id, memberOf(id)])),
		guild: {
			members: {
				resolve: memberOf,
				fetch: (id: string) => Promise.resolve(memberOf(id)),
			},
			roles: {
				resolve: (id: string) => (roleIds.includes(id) ? { id } : null),
				fetch: () => Promise.resolve(null),
			},
		},
		permissionsFor: (id: string) => ({
			has: () => !cannotConnect.includes(id),
		}),
		send: vi.fn().mockResolvedValue(undefined),
		toString: () => "#General",
	};
	return channel as unknown as VoiceBasedChannel & {
		send: ReturnType<typeof vi.fn>;
	};
};

const asUser = (id: string) => ({ id }) as unknown as User;

// filters where blockerId has targetId on their global blacklist
const blockedBy = (
	blockerId: string,
	targetId: string,
): Map<string, UserFilters> =>
	new Map([
		[
			blockerId,
			{
				channel: null,
				global: { isWhitelist: false, entries: new Set([targetId]) },
			},
		],
	]);

const modes = (entries: Record<string, DiscordUserMode> = {}) =>
	new Map(Object.entries(entries));

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(getFiltersForUsers).mockResolvedValue(new Map());
	vi.mocked(getUserModes).mockResolvedValue(modes());
	vi.mocked(getVoiceChatSignups).mockResolvedValue({
		userIds: [],
		roleIds: [],
	});
	vi.mocked(isAutoRingEnabled).mockResolvedValue(false);
	vi.mocked(getAllDefaultRingees).mockResolvedValue([]);
});

// validateRing rules

test("ringing yourself is rejected", () => {
	expect(() => validateRing(makeChannel(), "a", "a", new Map())).toThrow(
		"yourself",
	);
});

test("ringing someone who can't connect to the channel is rejected", () => {
	expect(() =>
		validateRing(makeChannel({ cannotConnect: ["b"] }), "a", "b", new Map()),
	).toThrow("can't join");
});

test("ringing someone already in the channel is rejected", () => {
	expect(() =>
		validateRing(makeChannel({ memberIds: ["b"] }), "a", "b", new Map()),
	).toThrow("already in");
});

test("ringing someone you blocked is rejected", () => {
	expect(() =>
		validateRing(makeChannel(), "a", "b", blockedBy("a", "b")),
	).toThrow("you blocked");
});

test("ringing someone who blocked you is rejected", () => {
	expect(() =>
		validateRing(makeChannel(), "a", "b", blockedBy("b", "a")),
	).toThrow("blocked you");
});

test("a ring with no objections passes", () => {
	expect(() => validateRing(makeChannel(), "a", "b", new Map())).not.toThrow();
});

// ring()

test("ring pings only the ringees who pass validation and reports each result", async () => {
	vi.mocked(getFiltersForUsers).mockResolvedValue(blockedBy("caller", "bad"));
	const channel = makeChannel();

	const results = await ring(channel, "caller", "wants you to join", [
		"good",
		"bad",
	]);

	expect(results).toStrictEqual([
		{ userId: "good", status: "fulfilled" },
		{ userId: "bad", status: "rejected", error: expect.any(Error) },
	]);
	expect(channel.send).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({ allowedMentions: { users: ["good"] } }),
	);
});

// signup pings on voice channel join

test("a signed-up user is pinged when someone starts a call", async () => {
	vi.mocked(getVoiceChatSignups).mockResolvedValue({
		userIds: ["s"],
		roleIds: [],
	});
	const channel = makeChannel({ memberIds: ["j"] });

	await onVoiceChannelJoin(channel, asUser("j"));

	expect(channel.send).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({ allowedMentions: { users: ["s"], roles: [] } }),
	);
});

test("a joiner in stealth mode pings nobody", async () => {
	vi.mocked(getVoiceChatSignups).mockResolvedValue({
		userIds: ["s"],
		roleIds: [],
	});
	vi.mocked(getUserModes).mockResolvedValue(modes({ j: "stealth" }));
	const channel = makeChannel({ memberIds: ["j"] });

	await onVoiceChannelJoin(channel, asUser("j"));

	expect(channel.send).not.toHaveBeenCalled();
});

test("auto mode counts as stealth while the joiner appears offline", async () => {
	vi.mocked(getVoiceChatSignups).mockResolvedValue({
		userIds: ["s"],
		roleIds: [],
	});
	vi.mocked(getUserModes).mockResolvedValue(modes({ j: "auto" }));
	const channel = makeChannel({
		memberIds: ["j"],
		memberOverrides: { j: { presenceStatus: "offline" } },
	});

	await onVoiceChannelJoin(channel, asUser("j"));

	expect(channel.send).not.toHaveBeenCalled();
});

test("nobody is pinged when a call is already active in the channel", async () => {
	vi.mocked(getVoiceChatSignups).mockResolvedValue({
		userIds: ["s"],
		roleIds: ["r"],
	});
	const channel = makeChannel({ memberIds: ["j", "other"], roleIds: ["r"] });

	await onVoiceChannelJoin(channel, asUser("j"));

	expect(channel.send).not.toHaveBeenCalled();
});

test("a signed-up user with a signed-up role is pinged via the role only", async () => {
	vi.mocked(getVoiceChatSignups).mockResolvedValue({
		userIds: ["s"],
		roleIds: ["r"],
	});
	const channel = makeChannel({
		memberIds: ["j"],
		roleIds: ["r"],
		memberOverrides: { s: { roleIds: ["r"] } },
	});

	await onVoiceChannelJoin(channel, asUser("j"));

	expect(channel.send).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({ allowedMentions: { users: [], roles: ["r"] } }),
	);
});

// auto-ring on voice channel join

test("auto-ring rings the joiner's default recipients when enabled", async () => {
	vi.mocked(isAutoRingEnabled).mockResolvedValue(true);
	vi.mocked(getAllDefaultRingees).mockResolvedValue(["d"]);
	const channel = makeChannel({ memberIds: ["j"] });

	await onVoiceChannelJoin(channel, asUser("j"));

	expect(channel.send).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({
			content: expect.stringContaining("wants you to join"),
			allowedMentions: { users: ["d"] },
		}),
	);
});

test("auto-ring with no default recipients is a quiet no-op", async () => {
	vi.mocked(isAutoRingEnabled).mockResolvedValue(true);
	const channel = makeChannel({ memberIds: ["j"] });

	await onVoiceChannelJoin(channel, asUser("j"));

	expect(channel.send).not.toHaveBeenCalled();
});

test("default recipients are not auto-rung when auto-ring is disabled", async () => {
	vi.mocked(getAllDefaultRingees).mockResolvedValue(["d"]);
	const channel = makeChannel({ memberIds: ["j"] });

	await onVoiceChannelJoin(channel, asUser("j"));

	expect(channel.send).not.toHaveBeenCalled();
});
