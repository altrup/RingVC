import { Interaction, PermissionsBitField } from "discord.js";
import { beforeEach, expect, test, vi } from "vitest";

import {
	addVoiceChatRole,
	getUserVoiceChatSignups,
	getVoiceChatRoleSignups,
	getVoiceChatSignups,
	removeVoiceChatRole,
	removeVoiceChatUser,
} from "@db/voice-chats";

import { signupsResetPost } from "./reset/post";
import { rolesByChannelResetPost } from "./roles/by-channel/reset/post";
import { rolesByChannelEditPost } from "./roles/by-channel/roles/post";
import { rolesByRoleEditPost } from "./roles/by-role/channels/post";
import { rolesByRoleResetPost } from "./roles/by-role/reset/post";

vi.mock("@db/voice-chats", () => ({
	getUserVoiceChatSignups: vi.fn(),
	getVoiceChatSignups: vi.fn(),
	getVoiceChatRoleSignups: vi.fn(),
	addVoiceChatUser: vi.fn(),
	removeVoiceChatUser: vi.fn(),
	addVoiceChatRole: vi.fn(),
	removeVoiceChatRole: vi.fn(),
}));

const makeInteraction = (managesRoles: boolean) =>
	({
		user: { id: "caller" },
		isChatInputCommand: () => false,
		memberPermissions: new PermissionsBitField(
			managesRoles ? PermissionsBitField.Flags.ManageRoles : 0n,
		),
		guild: {
			roles: { cache: new Map() },
			channels: {
				cache: new Map([["vc1", { id: "vc1", isVoiceBased: () => true }]]),
			},
		},
	}) as unknown as Interaction;

const editState = (opts: {
	scope: string;
	query?: string;
	values?: string[];
}) =>
	({
		params: { scope: opts.scope },
		queryParams: new URLSearchParams(opts.query ?? ""),
		values: opts.values,
		timestamp: 0,
	}) as unknown as Parameters<typeof rolesByChannelEditPost>[2];

const flashOf = (result: { queryParams?: unknown }) =>
	new URLSearchParams(result.queryParams as Record<string, string>);

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(addVoiceChatRole).mockResolvedValue(true);
	vi.mocked(removeVoiceChatRole).mockResolvedValue(true);
});

test("editing a channel's roles adds the newly selected role only", async () => {
	vi.mocked(getVoiceChatSignups).mockResolvedValue({
		userIds: [],
		roleIds: ["r1"],
	});

	const result = await rolesByChannelEditPost(
		undefined as never,
		makeInteraction(true),
		editState({ scope: "vc1", values: ["r1", "r2"] }),
	);

	expect(addVoiceChatRole).toHaveBeenCalledExactlyOnceWith("vc1", "r2");
	expect(removeVoiceChatRole).not.toHaveBeenCalled();
	expect(result.redirect).toBe("/signups/roles/by-channel/vc1");
	expect(flashOf(result).get("level")).toBe("success");
});

test("deselecting a role removes it from the channel", async () => {
	vi.mocked(getVoiceChatSignups).mockResolvedValue({
		userIds: [],
		roleIds: ["r1", "r2"],
	});

	await rolesByChannelEditPost(
		undefined as never,
		makeInteraction(true),
		editState({ scope: "vc1", values: ["r1"] }),
	);

	expect(removeVoiceChatRole).toHaveBeenCalledExactlyOnceWith("vc1", "r2");
	expect(addVoiceChatRole).not.toHaveBeenCalled();
});

test("the signuprole add param signs a role up for the channel", async () => {
	vi.mocked(getVoiceChatSignups).mockResolvedValue({
		userIds: [],
		roleIds: [],
	});

	const result = await rolesByChannelEditPost(
		undefined as never,
		makeInteraction(true),
		editState({ scope: "vc1", query: "add=r5" }),
	);

	expect(addVoiceChatRole).toHaveBeenCalledExactlyOnceWith("vc1", "r5");
	expect(result.redirect).toBe("/signups/roles/by-channel/vc1");
});

test("unsignuprole for a channel the role isn't in names both", async () => {
	vi.mocked(getVoiceChatRoleSignups).mockResolvedValue([]);

	const result = await rolesByRoleEditPost(
		undefined as never,
		makeInteraction(true),
		editState({ scope: "role1", query: "remove=vc1" }),
	);

	expect(removeVoiceChatRole).not.toHaveBeenCalled();
	expect(flashOf(result).get("level")).toBe("warn");
	expect(flashOf(result).get("flash")).toContain("isn't signed up for");
});

test("signuprole for a channel the role is already in names both", async () => {
	vi.mocked(getVoiceChatSignups).mockResolvedValue({
		userIds: [],
		roleIds: ["r1"],
	});

	const result = await rolesByChannelEditPost(
		undefined as never,
		makeInteraction(true),
		editState({ scope: "vc1", query: "add=r1" }),
	);

	expect(addVoiceChatRole).not.toHaveBeenCalled();
	expect(flashOf(result).get("flash")).toContain("already signed up for");
});

test("a role edit without Manage Roles mutates nothing", async () => {
	const result = await rolesByChannelEditPost(
		undefined as never,
		makeInteraction(false),
		editState({ scope: "vc1", values: ["r1", "r2"] }),
	);

	expect(addVoiceChatRole).not.toHaveBeenCalled();
	expect(flashOf(result).get("level")).toBe("warn");
	expect(flashOf(result).get("flash")).toContain("Manage Roles");
});

const resetState = (confirmation: string, scope?: string) =>
	({
		params: scope === undefined ? {} : { scope },
		queryParams: new URLSearchParams(),
		timestamp: 0,
		fields: { getTextInputValue: () => confirmation },
	}) as unknown as Parameters<typeof signupsResetPost>[2];

test("a signups reset clears only this guild's signups", async () => {
	vi.mocked(getUserVoiceChatSignups).mockResolvedValue(["vc1", "elsewhere"]);
	vi.mocked(removeVoiceChatUser).mockResolvedValue(true);

	const result = await signupsResetPost(
		undefined as never,
		makeInteraction(false),
		resetState("RESET"),
	);

	expect(removeVoiceChatUser).toHaveBeenCalledExactlyOnceWith("vc1", "caller");
	expect(flashOf(result).get("level")).toBe("success");
});

test("a signups reset without matching confirmation mutates nothing", async () => {
	vi.mocked(getUserVoiceChatSignups).mockResolvedValue(["vc1"]);

	const result = await signupsResetPost(
		undefined as never,
		makeInteraction(false),
		resetState("nope"),
	);

	expect(removeVoiceChatUser).not.toHaveBeenCalled();
	expect(flashOf(result).get("level")).toBe("warn");
	expect(flashOf(result).get("flash")).toContain("did not match");
});

test("a channel-roles reset clears every role pinged in the channel", async () => {
	vi.mocked(getVoiceChatSignups).mockResolvedValue({
		userIds: [],
		roleIds: ["r1", "r2"],
	});

	const result = await rolesByChannelResetPost(
		undefined as never,
		makeInteraction(true),
		resetState("RESET", "vc1"),
	);

	expect(removeVoiceChatRole).toHaveBeenCalledWith("vc1", "r1");
	expect(removeVoiceChatRole).toHaveBeenCalledWith("vc1", "r2");
	expect(result.redirect).toBe("/signups/roles/by-channel/vc1");
});

test("a role-signups reset without Manage Roles mutates nothing", async () => {
	const result = await rolesByRoleResetPost(
		undefined as never,
		makeInteraction(false),
		resetState("RESET", "role1"),
	);

	expect(removeVoiceChatRole).not.toHaveBeenCalled();
	expect(flashOf(result).get("flash")).toContain("Manage Roles");
});

test("a role-channels reset clears every channel the role is signed up for", async () => {
	vi.mocked(getVoiceChatRoleSignups).mockResolvedValue([
		{ roleId: "role1", channelId: "vcA" },
		{ roleId: "other", channelId: "vcC" },
	]);

	const result = await rolesByRoleResetPost(
		undefined as never,
		makeInteraction(true),
		resetState("RESET", "role1"),
	);

	expect(removeVoiceChatRole).toHaveBeenCalledExactlyOnceWith("vcA", "role1");
	expect(flashOf(result).get("level")).toBe("success");
	expect(result.redirect).toBe("/signups/roles/by-role/role1");
});
