import { Interaction, PermissionsBitField } from "discord.js";
import { beforeEach, expect, test, vi } from "vitest";

import {
	addVoiceChatRole,
	getVoiceChatRoleSignups,
	getVoiceChatSignups,
	removeVoiceChatRole,
} from "@db/voice-chats";

import { rolesByChannelEditPost } from "./roles/by-channel/roles/post";
import { rolesByRoleEditPost } from "./roles/by-role/channels/post";

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

test("unsignuprole removeAll clears every channel the role is signed up to", async () => {
	vi.mocked(getVoiceChatRoleSignups).mockResolvedValue([
		{ roleId: "role1", channelId: "vcA" },
		{ roleId: "role1", channelId: "vcB" },
		{ roleId: "other", channelId: "vcC" },
	]);

	const result = await rolesByRoleEditPost(
		undefined as never,
		makeInteraction(true),
		editState({ scope: "role1", query: "removeAll=1" }),
	);

	expect(removeVoiceChatRole).toHaveBeenCalledWith("vcA", "role1");
	expect(removeVoiceChatRole).toHaveBeenCalledWith("vcB", "role1");
	expect(removeVoiceChatRole).not.toHaveBeenCalledWith("vcC", "role1");
	expect(result.redirect).toBe("/signups/roles/by-role/role1");
});
