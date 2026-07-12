import { Interaction, PermissionsBitField } from "discord.js";
import { beforeEach, expect, test, vi } from "vitest";

import { addVoiceChatRole } from "@db/voice-chats";
import { signupsHandlers } from "@routes/signups";

vi.mock("@db/voice-chats", () => ({
	getUserVoiceChatSignups: vi.fn(),
	getVoiceChatRoleSignups: vi.fn(),
	addVoiceChatUser: vi.fn(),
	removeVoiceChatUser: vi.fn(),
	addVoiceChatRole: vi.fn(),
	removeVoiceChatRole: vi.fn(),
}));

const voiceChannel = { id: "vc1", isVoiceBased: () => true };
const makeInteraction = (admin: boolean) =>
	({
		user: { id: "caller" },
		memberPermissions: new PermissionsBitField(
			admin ? PermissionsBitField.Flags.ManageRoles : 0n,
		),
		guild: { channels: { cache: new Map([[voiceChannel.id, voiceChannel]]) } },
	}) as unknown as Interaction;

type RoleCommitPost = NonNullable<typeof signupsHandlers.roleCommit.post>;
const commitState = (query: string) =>
	({
		params: { roleId: "role1" },
		path: "/signups/roles/role1",
		queryParams: new URLSearchParams(query),
		timestamp: 0,
	}) as unknown as Parameters<RoleCommitPost>[2];

beforeEach(() => {
	vi.clearAllMocks();
});

test("committing a role signup that already exists rejects with a flash", async () => {
	vi.mocked(addVoiceChatRole).mockResolvedValue(false);

	const result = await signupsHandlers.roleCommit.post!(
		undefined as never,
		makeInteraction(true),
		commitState("channel=vc1"),
	);

	expect(result.redirect).toBe("/signups/roles");
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("warn");
	expect(flashParams.get("flash")).toContain("already");
});

test("committing a role signup succeeds and reports the mapping", async () => {
	vi.mocked(addVoiceChatRole).mockResolvedValue(true);

	const result = await signupsHandlers.roleCommit.post!(
		undefined as never,
		makeInteraction(true),
		commitState("channel=vc1"),
	);

	expect(addVoiceChatRole).toHaveBeenCalledExactlyOnceWith("vc1", "role1");
	expect(result.redirect).toBe("/signups/roles");
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("success");
});

test("a role signup commit without Manage Roles mutates nothing", async () => {
	const result = await signupsHandlers.roleCommit.post!(
		undefined as never,
		makeInteraction(false),
		commitState("channel=vc1"),
	);

	expect(addVoiceChatRole).not.toHaveBeenCalled();
	const flashParams = new URLSearchParams(
		result.queryParams as Record<string, string>,
	);
	expect(flashParams.get("level")).toBe("warn");
	expect(flashParams.get("flash")).toContain("Manage Roles");
});
