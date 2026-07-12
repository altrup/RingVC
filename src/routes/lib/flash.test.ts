import { expect, test } from "vitest";

import { flashLine, flashRedirect } from "@routes/lib/flash";

test("flashRedirect carries the flash text and level as redirect query params", () => {
	expect(flashRedirect("/filter/global", "Blocked <@1>", "success")).toStrictEqual({
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

test("flashLine renders the flash verbatim with an icon from the level alone", () => {
	expect(flashLine(new URLSearchParams({ flash: "Done", level: "success" }))).toBe(
		"✅ Done",
	);
	expect(flashLine(new URLSearchParams({ flash: "Careful", level: "warn" }))).toBe(
		"⚠️ Careful",
	);
});

test("flashLine returns null when no flash is present", () => {
	expect(flashLine(new URLSearchParams())).toBeNull();
	expect(flashLine(new URLSearchParams({ flash: "" }))).toBeNull();
});
