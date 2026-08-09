import { Interaction } from "discord.js";
import { expect, test } from "vitest";

import { flashIcon, flashLine, flashRedirect, NOTICE } from "@routes/lib/flash";

const component = {
	isChatInputCommand: () => false,
} as unknown as Interaction;
const command = { isChatInputCommand: () => true } as unknown as Interaction;

test("flashRedirect carries the flash text and level as redirect query params", () => {
	expect(
		flashRedirect(component, "/filter/global", "Blocked <@1>", "success"),
	).toStrictEqual({
		redirect: "/filter/global",
		queryParams: { flash: "Blocked <@1>", level: "success" },
	});
});

test("flashRedirect merges extra params like the page to stay on", () => {
	expect(
		flashRedirect(component, "/signups", "Signed up", "success", {
			page: "2",
		}),
	).toStrictEqual({
		redirect: "/signups",
		queryParams: { flash: "Signed up", level: "success", page: "2" },
	});
});

test("a slash-command mutation redirects to the notice with the panel as target", () => {
	expect(
		flashRedirect(command, "/ring", "Ringed <@1>", "success"),
	).toStrictEqual({
		redirect: NOTICE,
		queryParams: { flash: "Ringed <@1>", level: "success", to: "/ring" },
	});
});

test("a slash-command mutation folds extra params into the notice target", () => {
	expect(
		flashRedirect(command, "/signups", "Signed up", "success", { page: "2" }),
	).toStrictEqual({
		redirect: NOTICE,
		queryParams: {
			flash: "Signed up",
			level: "success",
			to: "/signups?page=2",
		},
	});
});

test("flashLine renders a bold blockquote led by the level icon", () => {
	expect(
		flashLine(new URLSearchParams({ flash: "Done", level: "success" })),
	).toBe("> **✅ Done**");
	expect(
		flashLine(new URLSearchParams({ flash: "Careful", level: "warn" })),
	).toBe("> **⚠️ Careful**");
});

test("every line of a multi-line flash is quoted and bolded", () => {
	expect(
		flashLine(
			new URLSearchParams({
				flash: "Rang @a\nCan't ring @b because they blocked you.",
				level: "warn",
			}),
		),
	).toBe("> **⚠️ Rang @a**\n> **Can't ring @b because they blocked you.**");
});

test("lines a producer already marked keep their own icons", () => {
	expect(
		flashLine(
			new URLSearchParams({
				flash: "✅ Ringed @a\n⚠️ Can't ring @b because you blocked them",
				level: "success",
			}),
		),
	).toBe("> **✅ Ringed @a**\n> **⚠️ Can't ring @b because you blocked them**");
});

test("flashIcon is the same icon the flash line leads with", () => {
	expect(flashIcon("warn")).toBe("⚠️");
	expect(flashIcon("success")).toBe("✅");
	expect(
		flashLine(new URLSearchParams({ flash: "Careful", level: "warn" })),
	).toBe(`> **${flashIcon("warn")} Careful**`);
});

test("flashLine returns null when no flash is present", () => {
	expect(flashLine(new URLSearchParams())).toBeNull();
	expect(flashLine(new URLSearchParams({ flash: "" }))).toBeNull();
});
