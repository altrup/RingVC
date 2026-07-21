import { EmbedRouter, RouteInfo } from "discord-embed-router";
import { Interaction } from "discord.js";
import { beforeEach, expect, test, vi } from "vitest";

import { recordError, recordUsage } from "@db/diagnostics";
import { Globals } from "@routes/types";

import { observeRouter } from "./diagnostics";

vi.mock("@db/diagnostics", () => ({
	recordError: vi.fn(),
	recordUsage: vi.fn(),
}));

const interaction = {} as Interaction;
const info = (trigger: RouteInfo["trigger"]): RouteInfo => ({
	method: "POST",
	path: "/ring/user",
	trigger,
});

const observedRouter = () => {
	const router = new EmbedRouter<Globals>();
	observeRouter(router);
	return router;
};

beforeEach(() => {
	vi.clearAllMocks();
});

test("an interaction-triggered route counts under its method and pattern", () => {
	observedRouter().emit("route", interaction, info("interaction"));

	expect(recordUsage).toHaveBeenCalledExactlyOnceWith("POST /ring/user");
});

test("dispatch and redirect hops are not counted", () => {
	const router = observedRouter();
	router.emit("route", interaction, info("dispatch"));
	router.emit("route", interaction, info("redirect"));

	expect(recordUsage).not.toHaveBeenCalled();
});

test("a route error is recorded under the failing route's key", () => {
	const boom = new Error("boom");
	observedRouter().emit("routeError", boom, interaction, info("interaction"));

	expect(recordError).toHaveBeenCalledExactlyOnceWith("POST /ring/user", boom);
});

test("a router-internal error with no route info is recorded as ROUTER", () => {
	const boom = new Error("boom");
	observedRouter().emit("routeError", boom, interaction, undefined);

	expect(recordError).toHaveBeenCalledExactlyOnceWith("ROUTER", boom);
});
