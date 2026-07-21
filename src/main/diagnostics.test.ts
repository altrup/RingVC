import { Interaction } from "discord.js";
import { beforeEach, expect, test, vi } from "vitest";

import { recordError, recordUsage } from "@db/diagnostics";
import { RingRouter } from "@routes/types";

import { instrumentRouter, recordInteractionUsage } from "./diagnostics";

vi.mock("@db/diagnostics", () => ({
	recordError: vi.fn(),
	recordUsage: vi.fn(),
}));

type AnyHandler = (...args: unknown[]) => unknown;
type Registered = Map<string, AnyHandler>;

// fake router capturing whatever handler ends up registered per method
const fakeRouter = () => {
	const registered: Registered = new Map();
	const register =
		(method: string) => (_path: unknown, handler: AnyHandler) => {
			registered.set(method, handler);
		};
	const router = {
		get: register("get"),
		post: register("post"),
		put: register("put"),
		patch: register("patch"),
		delete: register("delete"),
		modal: register("modal"),
		route: (_path: unknown, handlers: Record<string, AnyHandler>) => {
			for (const [method, handler] of Object.entries(handlers)) {
				registered.set(`route:${method}`, handler);
			}
		},
	};
	return { router: router as unknown as RingRouter, registered };
};

const anInteraction = () => ({ id: "interaction" }) as unknown as Interaction;

beforeEach(() => {
	vi.clearAllMocks();
});

test("a wrapped handler records usage keyed by method and path", async () => {
	const { router, registered } = fakeRouter();
	instrumentRouter(router);

	router.post("/ring/user", vi.fn().mockResolvedValue({ redirect: "/ring" }));
	const result = await registered.get("post")?.("router", anInteraction(), {});

	expect(recordUsage).toHaveBeenCalledExactlyOnceWith("POST /ring/user");
	expect(result).toEqual({ redirect: "/ring" });
});

test("a multi-path registration is keyed by its first path", async () => {
	const { router, registered } = fakeRouter();
	instrumentRouter(router);

	router.get(["/filter", "/filter/:scope"], vi.fn().mockResolvedValue({}));
	await registered.get("get")?.("router", anInteraction(), {});

	expect(recordUsage).toHaveBeenCalledExactlyOnceWith("GET /filter");
});

test("route() wraps each handler under its own method", async () => {
	const { router, registered } = fakeRouter();
	instrumentRouter(router);

	router.route("/mode", {
		get: vi.fn().mockResolvedValue({}),
		post: vi.fn().mockResolvedValue({ redirect: "/mode" }),
	});
	await registered.get("route:get")?.("router", anInteraction(), {});
	await registered.get("route:post")?.("router", anInteraction(), {});

	expect(vi.mocked(recordUsage).mock.calls).toEqual([
		["GET /mode"],
		["POST /mode"],
	]);
});

test("one interaction passing through several handlers counts once", async () => {
	const { router, registered } = fakeRouter();
	instrumentRouter(router);

	router.post("/mode", vi.fn().mockResolvedValue({ redirect: "/mode" }));
	router.get("/mode", vi.fn().mockResolvedValue({}));

	const interaction = anInteraction();
	await registered.get("post")?.("router", interaction, {});
	await registered.get("get")?.("router", interaction, {});

	expect(recordUsage).toHaveBeenCalledExactlyOnceWith("POST /mode");
});

test("a command-counted interaction is not recounted by route handlers", async () => {
	const { router, registered } = fakeRouter();
	instrumentRouter(router);

	router.get("/ring", vi.fn().mockResolvedValue({}));

	const interaction = anInteraction();
	recordInteractionUsage("COMMAND /ring", interaction);
	await registered.get("get")?.("router", interaction, {});

	expect(recordUsage).toHaveBeenCalledExactlyOnceWith("COMMAND /ring");
});

test("a rejecting handler records the error and still rejects", async () => {
	const { router, registered } = fakeRouter();
	instrumentRouter(router);

	const boom = new Error("boom");
	router.post("/ring/user", vi.fn().mockRejectedValue(boom));

	await expect(
		registered.get("post")?.("router", anInteraction(), {}),
	).rejects.toThrow("boom");
	expect(recordError).toHaveBeenCalledExactlyOnceWith("POST /ring/user", boom);
});

test("a synchronously throwing handler records the error and still throws", () => {
	const { router, registered } = fakeRouter();
	instrumentRouter(router);

	const boom = new Error("boom");
	router.get("/help", () => {
		throw boom;
	});

	expect(() => registered.get("get")?.("router", anInteraction(), {})).toThrow(
		"boom",
	);
	expect(recordError).toHaveBeenCalledExactlyOnceWith("GET /help", boom);
});

test("an error propagating through nested handlers is recorded once", async () => {
	const { router, registered } = fakeRouter();
	instrumentRouter(router);

	const boom = new Error("boom");
	router.get("/ring", vi.fn().mockRejectedValue(boom));

	const interaction = anInteraction();
	const inner = registered.get("get")?.("router", interaction, {});
	router.post("/ring/user", () => inner as never);
	await expect(
		registered.get("post")?.("router", interaction, {}),
	).rejects.toThrow("boom");

	expect(recordError).toHaveBeenCalledExactlyOnceWith("GET /ring", boom);
});
