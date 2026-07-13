import { flashLine, flashRedirect } from "@routes/lib/flash";
import { expect, test } from "vitest";

test("flashRedirect carries the flash text and level as redirect query params", () => {
	expect(
		flashRedirect("/filter/global", "Blocked <@1>", "success"),
	).toStrictEqual({
		redirect: "/filter/global",
		queryParams: { flash: "Blocked <@1>", level: "success" },
	});
});

test("flashRedirect merges extra params like the page to stay on", () => {
	expect(
		flashRedirect("/signups", "Signed up", "success", { page: "2" }),
	).toStrictEqual({
		redirect: "/signups",
		queryParams: { flash: "Signed up", level: "success", page: "2" },
	});
});

test("flashLine renders a blockquote with the level icon and a bold lead", () => {
	expect(
		flashLine(new URLSearchParams({ flash: "Done", level: "success" })),
	).toBe("> ✅ **Done**");
	expect(
		flashLine(new URLSearchParams({ flash: "Careful", level: "warn" })),
	).toBe("> ⚠️ **Careful**");
});

test("flashLine bolds only the opening clause through the first period", () => {
	expect(
		flashLine(
			new URLSearchParams({
				flash: "Auto-ring enabled. You'll ring these people.",
				level: "success",
			}),
		),
	).toBe("> ✅ **Auto-ring enabled.** You'll ring these people.");
});

test("flashLine keeps the bold lead within the first line of a multi-line flash", () => {
	expect(
		flashLine(
			new URLSearchParams({
				flash: "Rang @a\nCan't ring @b because they blocked you.",
				level: "warn",
			}),
		),
	).toBe("> ⚠️ **Rang @a**\n> Can't ring @b because they blocked you.");
});

test("flashLine returns null when no flash is present", () => {
	expect(flashLine(new URLSearchParams())).toBeNull();
	expect(flashLine(new URLSearchParams({ flash: "" }))).toBeNull();
});
