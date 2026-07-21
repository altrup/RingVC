import { expect, test, vi } from "vitest";

import { db } from "./client";
import { recordError } from "./diagnostics";

vi.mock("./client", () => ({
	db: { from: vi.fn(), rpc: vi.fn() },
}));

test("recordError stores the error type and stack frames, never the message", () => {
	const insert = vi.fn().mockResolvedValue({ error: null });
	vi.mocked(db.from).mockReturnValue({ insert } as never);

	const boom = new Error("<@123456789012345678> can't join #secret-lounge");
	recordError("POST /ring/user", boom);

	expect(db.from).toHaveBeenCalledWith("error_reports");
	const stored = insert.mock.calls[0]?.[0] as { error: string };
	expect(stored.error).toMatch(/^Error\n/);
	expect(stored.error).toContain("at ");
	expect(stored.error).not.toContain("secret-lounge");
	expect(stored.error).not.toContain("123456789012345678");
});

test("recordError describes the root cause of a wrapped error", () => {
	const insert = vi.fn().mockResolvedValue({ error: null });
	vi.mocked(db.from).mockReturnValue({ insert } as never);

	const cause = Object.assign(new TypeError("deep failure"), { code: 10003 });
	recordError(
		"GET /ring",
		new Error("Error while handling GET /ring", { cause }),
	);

	const stored = insert.mock.calls[0]?.[0] as { error: string };
	expect(stored.error).toMatch(/^TypeError \(10003\)/);
});

test("recordError includes an error code when one is present", () => {
	const insert = vi.fn().mockResolvedValue({ error: null });
	vi.mocked(db.from).mockReturnValue({ insert } as never);

	const apiError = Object.assign(new Error("Missing Access in My Server"), {
		code: 50001,
	});
	recordError("GET /ring", apiError);

	const stored = insert.mock.calls[0]?.[0] as { error: string };
	expect(stored.error).toMatch(/^Error \(50001\)/);
	expect(stored.error).not.toContain("My Server");
});
